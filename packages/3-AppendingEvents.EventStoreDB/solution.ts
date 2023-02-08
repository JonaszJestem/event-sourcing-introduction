import { randomUUID } from 'crypto';
import {
  EventStoreDBClient,
  jsonEvent,
  FORWARDS,
  START,
  JSONEventType,
} from '@eventstore/db-client';

// EVENTS
class ShoppingCartOpened implements JSONEventType {
  public readonly type = 'shopping-cart-opened';

  constructor(
    public readonly data: {
      shoppingCartId: string;
      clientId: string;
    }
  ) {}
}

class ProductItemAddedToShoppingCart implements JSONEventType {
  public readonly type = 'product-item-added-to-shopping-cart';

  constructor(
    public readonly data: {
      shoppingCartId: string;
      productItem: PricedProductItem;
    }
  ) {}
}

class ProductItemRemovedFromShoppingCart implements JSONEventType {
  public readonly type = 'product-item-removed-from-shopping-cart';

  constructor(
    public readonly data: {
      shoppingCartId: string;
      productItem: PricedProductItem;
    }
  ) {}
}

class ShoppingCartConfirmed implements JSONEventType {
  public readonly type = 'shopping-cart-confirmed';

  constructor(
    public readonly data: {
      shoppingCartId: string;
      confirmedAt: Date;
    }
  ) {}
}

class ShoppingCartCanceled implements JSONEventType {
  public readonly type = 'shopping-cart-canceled';

  constructor(
    public readonly data: {
      shoppingCartId: string;
      canceledAt: Date;
    }
  ) {}
}

// VALUE OBJECTS
class PricedProductItem {
  constructor(
    public productId: string,
    public quantity: number,
    public unitPrice: number
  ) {}

  get totalPrice() {
    return this.unitPrice * this.quantity;
  }
}

// ENTITY

// regular one
class ShoppingCart {
  constructor(
    public id?: string,
    public clientId?: string,
    public status?: ShoppingCartStatus,
    public productItems?: PricedProductItem[],
    public confirmedAt?: Date,
    public canceledAt?: Date
  ) {}
}

enum ShoppingCartStatus {
  Pending = 1,
  Confirmed = 2,
  Canceled = 4,
}

describe('GettingStateFromEventsTests', () => {
  it('it should get state for sequence of events', async function () {
    const clientId = randomUUID();
    const shoppingCartId = randomUUID();
    const shoesId = randomUUID();
    const tShirtId = randomUUID();
    const twoPairsOfShoes = new PricedProductItem(shoesId, 2, 100);
    const pairOfShoes = new PricedProductItem(shoesId, 1, 100);
    const tShirt = new PricedProductItem(tShirtId, 1, 50);

    const events = [
      new ShoppingCartOpened({ shoppingCartId, clientId }),
      new ProductItemAddedToShoppingCart({
        shoppingCartId,
        productItem: twoPairsOfShoes,
      }),
      new ProductItemAddedToShoppingCart({
        shoppingCartId,
        productItem: tShirt,
      }),
      new ProductItemRemovedFromShoppingCart({
        shoppingCartId,
        productItem: pairOfShoes,
      }),
      new ShoppingCartConfirmed({ shoppingCartId, confirmedAt: new Date() }),
      new ShoppingCartCanceled({ shoppingCartId, canceledAt: new Date() }),
    ];

    const client = new EventStoreDBClient(
      {
        endpoint: 'localhost:2113',
      },
      { insecure: true }
    );

    const streamName = `shopping_cart-${shoppingCartId}`;
    await client.appendToStream(
      streamName,
      events.map((event) => jsonEvent(event))
    );

    const eventsStream = client.readStream(streamName, {
      fromRevision: START,
      direction: FORWARDS,
      maxCount: 10,
    });
    const savedEvents: any[] = [];
    for await (const { event } of eventsStream) {
      savedEvents.push(event);
    }
    expect(savedEvents).toHaveLength(6);
  });
});
