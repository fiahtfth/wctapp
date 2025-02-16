'use client';

import { Button, Stack, Typography } from '@mui/material';
import React from 'react';

interface PaginationControlsProps extends React.HTMLAttributes<HTMLDivElement> {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function PaginationControls({
    currentPage,
    totalPages,
    onPageChange,
    ...props
}: PaginationControlsProps) {
    return (
        <Stack 
            direction="row" 
            spacing={2} 
            alignItems="center" 
            sx={{ mt: 3 }}
            {...props}
        >
            <Button 
                variant="outlined" 
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                Previous
            </Button>
            <Typography variant="body1">
                Page {currentPage} of {totalPages}
            </Typography>
            <Button 
                variant="outlined" 
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                Next
            </Button>
        </Stack>
    );
}
