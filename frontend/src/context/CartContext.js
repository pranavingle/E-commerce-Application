import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const parseStoredJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.product === action.payload.product);
      const items = existing
        ? state.items.map(i =>
            i.product === action.payload.product
              ? { ...i, quantity: Math.min(i.quantity + action.payload.quantity, action.payload.stock) }
              : i
          )
        : [...state.items, action.payload];
      return { ...state, items };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.product !== action.payload) };
    case 'UPDATE_QUANTITY': {
      const items = state.items.map(i =>
        i.product === action.payload.product ? { ...i, quantity: action.payload.quantity } : i
      );
      return { ...state, items };
    }
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'SET_SHIPPING':
      return { ...state, shippingAddress: action.payload };
    case 'SET_PAYMENT':
      return { ...state, paymentMethod: action.payload };
    default:
      return state;
  }
};

const initialState = {
  items: parseStoredJson('shopezCart', []),
  shippingAddress: parseStoredJson('shopezShipping', null),
  paymentMethod: localStorage.getItem('shopezPayment') || 'COD',
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    localStorage.setItem('shopezCart', JSON.stringify(state.items));
  }, [state.items]);

  useEffect(() => {
    if (state.shippingAddress) {
      localStorage.setItem('shopezShipping', JSON.stringify(state.shippingAddress));
    }
  }, [state.shippingAddress]);

  useEffect(() => {
    localStorage.setItem('shopezPayment', state.paymentMethod);
  }, [state.paymentMethod]);

  const addToCart = (item) => dispatch({ type: 'ADD_ITEM', payload: item });
  const removeFromCart = (id) => dispatch({ type: 'REMOVE_ITEM', payload: id });
  const updateQuantity = (product, quantity) => dispatch({ type: 'UPDATE_QUANTITY', payload: { product, quantity } });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });
  const saveShippingAddress = (address) => dispatch({ type: 'SET_SHIPPING', payload: address });
  const savePaymentMethod = (method) => dispatch({ type: 'SET_PAYMENT', payload: method });

  const itemsCount = state.items.reduce((acc, i) => acc + i.quantity, 0);
  const itemsPrice = state.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const discountPrice = state.items.reduce((acc, i) => acc + (i.discountPrice || i.price) * i.quantity, 0);
  const shippingPrice = itemsPrice > 500 ? 0 : 49;
  const taxPrice = Number((0.18 * discountPrice).toFixed(2));
  const totalPrice = Number((discountPrice + shippingPrice + taxPrice).toFixed(2));

  return (
    <CartContext.Provider
      value={{
        ...state,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        saveShippingAddress,
        savePaymentMethod,
        itemsCount,
        itemsPrice,
        discountPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
