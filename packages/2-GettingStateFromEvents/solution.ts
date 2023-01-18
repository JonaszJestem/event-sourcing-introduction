import { randomUUID } from 'crypto';
import { groupBy } from 'lodash';

// EVENTS
class ShoppingCartOpened {
  constructor(
    public readonly shoppingCartId: string,
    public readonly clientId: string
  ) {
  }
}

class ProductItemAddedToShoppingCart {
  constructor(
    public readonly shoppingCartId: string,
    public readonly productItem: PricedProductItem
  ) {
  }
}

class ProductItemRemovedFromShoppingCart {
  constructor(
    public readonly shoppingCartId: string,
    public readonly productItem: PricedProductItem
  ) {
  }
}

class ShoppingCartConfirmed {
  constructor(
    public readonly shoppingCartId: string,
    public readonly confirmedAt: Date
  ) {
  }
}

class ShoppingCartCanceled {
  constructor(
    public readonly shoppingCartId: string,
    public readonly canceledAt: Date
  ) {
  }
}

// VALUE OBJECTS
class PricedProductItem {
  constructor(
    public productId: string,
    public quantity: number,
    public unitPrice: number,
  ) {
  }

  get totalPrice() {
    return this.unitPrice * this.quantity;
  }
}

class ImmutablePricedProductItem {
  constructor(
    public readonly productId: string,
    public readonly unitPrice: number,
    public readonly quantity: number
  ) {
  }

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
  ) {
  }
}

class ImmutableShoppingCart {
  constructor(
    public readonly id: string,
    public readonly clientId: string,
    public readonly status: ShoppingCartStatus,
    public readonly productItems: PricedProductItem[],
    public readonly confirmedAt: Date,
    public readonly canceledAt: Date
  ) {
  }
}

enum ShoppingCartStatus {
  Pending = 1,
  Confirmed = 2,
  Canceled = 4,
}

describe('GettingStateFromEventsTests', () => {
  const getShoppingCart = (events: any[]): ShoppingCart => {
    let shoppingCart = new ShoppingCart();

    events.forEach((event) => {
      if (event instanceof ShoppingCartOpened) {
        shoppingCart = new ShoppingCart(
          event.shoppingCartId,
          event.clientId,
          ShoppingCartStatus.Pending,
          []
        );
      } else if (event instanceof ProductItemAddedToShoppingCart) {
        const indexOfProductInCart = shoppingCart.productItems?.findIndex(
          (product) => product.productId === event.productItem.productId
        );

        if (indexOfProductInCart !== undefined && indexOfProductInCart !== -1) {
          shoppingCart.productItems?.splice(
            indexOfProductInCart,
            1,
            new PricedProductItem(
              event.productItem.productId,
              event.productItem.quantity +
              shoppingCart.productItems[indexOfProductInCart].quantity,
              event.productItem.unitPrice,
            )
          );
        } else {
          shoppingCart.productItems?.push(
            new PricedProductItem(
              event.productItem.productId,
              event.productItem.quantity,
              event.productItem.unitPrice,
            )
          );
        }
      } else if (event instanceof ProductItemRemovedFromShoppingCart) {
        const indexOfProductInCart = shoppingCart.productItems?.findIndex(
          (product) => product.productId === event.productItem.productId
        );

        if (indexOfProductInCart !== undefined && indexOfProductInCart !== -1) {
          shoppingCart.productItems?.splice(
            indexOfProductInCart,
            1,
            new PricedProductItem(
              event.productItem.productId,
              shoppingCart.productItems[indexOfProductInCart].quantity -
              event.productItem.quantity,
              event.productItem.unitPrice,
            )
          );
          shoppingCart.productItems = shoppingCart.productItems?.filter(
            (p) => p.quantity > 0
          );
        }
      } else if (event instanceof ShoppingCartConfirmed) {
        shoppingCart.status = ShoppingCartStatus.Confirmed;
        shoppingCart.confirmedAt = event.confirmedAt;
      } else if (event instanceof ShoppingCartCanceled) {
        shoppingCart.status = ShoppingCartStatus.Canceled;
        shoppingCart.canceledAt = event.canceledAt;
      }
    });

    return shoppingCart;
  };

  it('it should get state for sequence of events', function () {
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
    expect(shoppingCart.productItems?.[0]).toEqual(pairOfShoes);
    expect(shoppingCart.productItems?.[1]).toEqual(tShirt);
  });
});
