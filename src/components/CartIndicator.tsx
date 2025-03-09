import React, { forwardRef } from 'react';
import { IconButton, Badge, Tooltip } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';

interface CartIndicatorProps {
  color?: string;
  count?: number;
}

const CartIndicator = forwardRef<HTMLDivElement, CartIndicatorProps>(
  ({ color = 'inherit', count }, ref) => {
    const cartStore = useCartStore();
    const cartCount = count !== undefined ? count : cartStore.questions.length;

    return (
      <div ref={ref}>
        <Link href="/cart" passHref>
          <Tooltip title={`View Cart (${cartCount} items)`}>
            <IconButton color="inherit" aria-label="cart">
              <Badge badgeContent={cartCount} color="error" overlap="circular">
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
