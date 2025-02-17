import React, { useEffect, useState } from 'react';
import { IconButton, Badge, Tooltip } from '@mui/material';
import { ShoppingCart as CartIcon } from '@mui/icons-material';
import { useCartStore } from '@/store/cartStore';
import Link from 'next/link';

interface CartIndicatorProps {
  color?: 'inherit' | 'primary' | 'secondary';
  count?: number;
}

export default function CartIndicator({ color = 'inherit', count }: CartIndicatorProps) {
  const [mounted, setMounted] = useState(false);
  const questions = useCartStore((state) => {
    console.log('CartIndicator: Current cart questions', state.questions);
    return state.questions;
  });

  useEffect(() => {
    // Ensure this only runs on the client
    setMounted(true);
    console.log('CartIndicator mounted, current cart questions:', questions);
  }, []);

  if (!mounted) return null;

  const cartCount = count !== undefined ? count : questions.length;

  return (
    <Link href="/cart" passHref style={{ textDecoration: 'none' }}>
      <Tooltip title={`View Cart (${cartCount} items)`}>
        <IconButton color={color}>
          <Badge 
            badgeContent={cartCount} 
            color="primary" 
            max={99}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <CartIcon />
          </Badge>
        </IconButton>
      </Tooltip>
    </Link>
  );
}
