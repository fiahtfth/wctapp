import React, { forwardRef, useState, useEffect } from 'react';
import { IconButton, Badge, Tooltip } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';

interface CartIndicatorProps {
  color?: string;
  count?: number;
  refreshInterval?: number; // in milliseconds
}

const CartIndicator = forwardRef<HTMLDivElement, CartIndicatorProps>(
  ({ color = 'inherit', count, refreshInterval = 2000 }, ref) => {
    const cartStore = useCartStore();
    const [cartCount, setCartCount] = useState(count !== undefined ? count : cartStore.questions.length);
    
    // Update cart count when the store changes or at regular intervals
    useEffect(() => {
      // Initial update
      setCartCount(count !== undefined ? count : cartStore.getCartCount());
      
      // Set up interval for regular updates
      const intervalId = setInterval(() => {
        setCartCount(count !== undefined ? count : cartStore.getCartCount());
      }, refreshInterval);
      
      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    }, [count, cartStore, refreshInterval]);
    
    // Update immediately when count prop changes
    useEffect(() => {
      if (count !== undefined) {
        setCartCount(count);
      }
    }, [count]);

    return (
      <div ref={ref}>
        <Link href="/cart" passHref>
          <Tooltip title={`View Cart (${cartCount} items)`}>
            <IconButton color="inherit" aria-label={`View cart with ${cartCount} items`}>
              <Badge badgeContent={cartCount} color="error" overlap="circular" max={99}>
                <ShoppingCartIcon sx={{ color }} />
              </Badge>
            </IconButton>
          </Tooltip>
        </Link>
      </div>
    );
  }
);

CartIndicator.displayName = 'CartIndicator';

export default React.memo(CartIndicator);
