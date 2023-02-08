import { randomUUID } from 'crypto';

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

// ENTITY

// regular one
class ShoppingCart {
  private constructor(
    public id?: string,
    public clientId?: string,
    public status?: ShoppingCartStatus,
    public productItems?: PricedProductItem[],
    public confirmedAt?: Date,
    public canceledAt?: Date
  ) {
  }

  addProduct(event: ProductItemAddedToShoppingCart) {
    const indexOfProductInCart = this.productItems?.findIndex(
      (product) => product.productId === event.productItem.productId
    );

    if (indexOfProductInCart !== undefined && indexOfProductInCart !== -1) {
      this.productItems?.splice(
        indexOfProductInCart,
        1,
        new PricedProductItem(
          event.productItem.productId,
          event.productItem.quantity +
          this.productItems[indexOfProductInCart].quantity,
          event.productItem.unitPrice,
        )
      );
    } else {
      this.productItems?.push(
        new PricedProductItem(
          event.productItem.productId,
          event.productItem.quantity,
          event.productItem.unitPrice,
        )
      );
    }
  }

  removeProduct(event: ProductItemRemovedFromShoppingCart) {
    const indexOfProductInCart = this.productItems?.findIndex(
      (product) => product.productId === event.productItem.productId
    );

    if (indexOfProductInCart !== undefined && indexOfProductInCart !== -1) {
      this.productItems?.splice(
        indexOfProductInCart,
        1,
        new PricedProductItem(
          event.productItem.productId,
          this.productItems[indexOfProductInCart].quantity -
          event.productItem.quantity,
          event.productItem.unitPrice,
        )
      );
      this.productItems = this.productItems?.filter(
        (p) => p.quantity > 0
      );
    }
  }

  confirm(event: ShoppingCartConfirmed) {
    this.status = ShoppingCartStatus.Confirmed;
    this.confirmedAt = event.confirmedAt;
  }

  cancel(event: ShoppingCartCanceled) {
    this.status = ShoppingCartStatus.Canceled;
    this.canceledAt = event.canceledAt;
  }

  static openWith(event: ShoppingCartOpened) {
    return new ShoppingCart(
      event.shoppingCartId,
      event.clientId,
      ShoppingCartStatus.Pending,
      []
    );
  }
}

enum ShoppingCartStatus {
  Pending = 1,
  Confirmed = 2,
  Canceled = 4,
}

describe('GettingStateFromEventsTests', () => {
  const getShoppingCart = (events: any[]): ShoppingCart => {
    let shoppingCart: ShoppingCart;

    events.forEach((event) => {
      if (event instanceof ShoppingCartOpened) {
        shoppingCart = ShoppingCart.openWith(event)
      } else if (event instanceof ProductItemAddedToShoppingCart) {
        shoppingCart.addProduct(event)
      } else if (event instanceof ProductItemRemovedFromShoppingCart) {
        shoppingCart.removeProduct(event)
      } else if (event instanceof ShoppingCartConfirmed) {
        shoppingCart.confirm(event)
      } else if (event instanceof ShoppingCartCanceled) {
        shoppingCart.cancel(event)
      }
    });

    return shoppingCart!;
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
