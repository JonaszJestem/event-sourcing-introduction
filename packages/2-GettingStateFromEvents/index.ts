import { randomUUID } from 'crypto';

// EVENTS
class ShoppingCartOpened {
  constructor(
    public readonly shoppingCartId: string,
    public readonly clientId: string
  ) {}
}

class ProductItemAddedToShoppingCart {
  constructor(
    public readonly shoppingCartId: string,
    public readonly productItem: PricedProductItem
  ) {}
}

class ProductItemRemovedFromShoppingCart {
  constructor(
    public readonly shoppingCartId: string,
    public readonly productItem: PricedProductItem
  ) {}
}

class ShoppingCartConfirmed {
  constructor(
    public readonly shoppingCartId: string,
    public readonly confirmedAt: Date
  ) {}
}

class ShoppingCartCanceled {
  constructor(
    public readonly shoppingCartId: string,
    public readonly canceledAt: Date
  ) {}
}

// VALUE OBJECTS
class PricedProductItem {
  constructor(
    public productId: string,
    public unitPrice: number,
    public quantity: number
  ) {}

  get totalPrice() {
    return this.unitPrice * this.quantity;
  }
}

class ImmutablePricedProductItem {
  constructor(
    public readonly productId: string,
    public readonly unitPrice: number,
    public readonly quantity: number
  ) {}

  get totalPrice() {
    return this.unitPrice * this.quantity;
  }
}

// ENTITY

// regular one
class ShoppingCart {
  constructor(
    public readonly id: string,
    public readonly clientId: string,
    public readonly status: ShoppingCartStatus,
    public readonly productItems: PricedProductItem[],
    public readonly confirmedAt: Date,
    public readonly canceledAt: Date
  ) {}
}

class ImmutableShoppingCart {
  constructor(
    public id: string,
    public clientId: string,
    public status: ShoppingCartStatus,
    public productItems: PricedProductItem[],
    public confirmedAt: Date,
    public canceledAt: Date
  ) {}
}

enum ShoppingCartStatus {
  Pending = 1,
  Confirmed = 2,
  Canceled = 4,
}

describe('GettingStateFromEventsTests', () => {
  const getShoppingCart = (events: any[]): ShoppingCart => {
    throw new Error('Not implemented yet');
  };

  it('it should get state for sequence of events', function () {
    const expectedEventTypesCount = 5;
    const clientId = randomUUID();
    const shoppingCartId = randomUUID();
    const shoesId = randomUUID();
    const tShirtId = randomUUID();
    const twoPairsOfShoes = new PricedProductItem(shoesId, 2, 100);
    const pairOfShoes = new PricedProductItem(shoesId, 1, 100);
    const tShirt = new PricedProductItem(tShirtId, 1, 50);

    const events = [
      new ShoppingCartOpened(shoppingCartId, clientId),
      new ProductItemAddedToShoppingCart(shoppingCartId, twoPairsOfShoes),
      new ProductItemAddedToShoppingCart(shoppingCartId, tShirt),
      new ProductItemRemovedFromShoppingCart(shoppingCartId, pairOfShoes),
      new ShoppingCartConfirmed(shoppingCartId, new Date()),
      new ShoppingCartCanceled(shoppingCartId, new Date()),
    ];

    const shoppingCart = getShoppingCart(events);

    expect(shoppingCart.id).toEqual(shoppingCartId);
    expect(shoppingCart.clientId).toEqual(clientId);
    expect(shoppingCart.productItems).toHaveLength(2);
    expect(shoppingCart.productItems[0]).toEqual(pairOfShoes);
    expect(shoppingCart.productItems[1]).toEqual(tShirt);
  });
});
