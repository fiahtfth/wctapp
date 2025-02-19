import React from "react";
import { IconButton, Badge, Tooltip } from "@mui/material";
import { ShoppingCart as CartIcon } from "@mui/icons-material";
import { useCartStore } from "@/store/cartStore";
import Link from "next/link";
import dynamic from "next/dynamic";

interface CartIndicatorProps {
  color?: "inherit" | "primary" | "secondary";
  count?: number;
}

function CartIndicator({ color = "inherit", count }: CartIndicatorProps) {
  const questions = useCartStore((state) => state.questions);

  const cartCount = count !== undefined ? count : questions.length;

  return (
    <Link href="/cart" passHref style={{ textDecoration: "none" }}>
      <Tooltip title={`View Cart (${cartCount} items)`}>
        <IconButton color={color}>
          <Badge
            badgeContent={cartCount}
            color="primary"
            max={99}
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <CartIcon />
          </Badge>
        </IconButton>
      </Tooltip>
    </Link>
  );
}

export default dynamic(() => Promise.resolve(CartIndicator), {
  ssr: false,
});
