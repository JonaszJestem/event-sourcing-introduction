import { randomUUID } from 'crypto';

// 1. Define your events and entity here
// EVENTS
class ShoppingCartOpened {
  constructor(
    public readonly shoppingCartId: string,
    public readonly clientId: string,
  ) {
  }
}

class ProductItemAddedToShoppingCart {
  constructor(
    public readonly shoppingCartId: string,
    public readonly productItem: PricedProductItem,
  ) {
  }
}

class ProductItemRemovedFromShoppingCart {
  constructor(
    public readonly shoppingCartId: string,
    public readonly productItem: PricedProductItem,
  ) {
  }
}

class ShoppingCartConfirmed {
  constructor(
    public readonly shoppingCartId: string,
    public readonly confirmedAt: Date,
  ) {
  }
}

class ShoppingCartCanceled {
  constructor(
    public readonly shoppingCartId: string,
    public readonly canceledAt: Date,
  ) {
  }
}

// VALUE OBJECTS
class PricedProductItem {
  constructor(
    public productId: string,
    public unitPrice: number,
    public quantity: number,
  ) {
  }

  get totalPrice() {
    return this.unitPrice * this.quantity;
  }
}

// ENTITY
class ShoppingCart {
  constructor(
    public readonly id: string,
    public readonly clientId: string,
    public readonly status: ShoppingCartStatus,
    public readonly productItems: PricedProductItem[],
    public readonly confirmedAt: Date,
    public readonly canceledAt: Date,
  ) {
  }
}

enum ShoppingCartStatus {
  Pending = 1,
  Confirmed = 2,
  Canceled = 4
}

describe('EventsDefinitionTests', () => {
  it('should define all the event types', function () {
    const expectedEventTypesCount = 5;
    const shoppingCartId = randomUUID();
    const clientId = randomUUID();
    const pairOfShoes = new PricedProductItem(randomUUID(), 1, 100)

    const events = [
      new ShoppingCartOpened(shoppingCartId, clientId),
      new ProductItemAddedToShoppingCart(shoppingCartId, pairOfShoes),
      new ProductItemRemovedFromShoppingCart(shoppingCartId, pairOfShoes),
      new ShoppingCartConfirmed(shoppingCartId, new Date()),
      new ShoppingCartCanceled(shoppingCartId, new Date())
    ];

    expect(events).toHaveLength(expectedEventTypesCount);
  });
});