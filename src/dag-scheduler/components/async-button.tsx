import { Button, ButtonProps, CircularProgress } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

type Props = ButtonProps & {
  onClick: (...args: any[]) => Promise<void>;
};

export function AsyncButton(props: Props): JSX.Element {
  const [isPending, setIsPending] = useState(false);
  const mountRef = useRef(false);

  const iconProps =
    props.variant === 'outlined'
      ? { color: 'primary' }
      : {
          style: { color: 'white' }
        };

  const pendingProps = isPending
    ? {
        endIcon: <CircularProgress size={'14px'} {...(iconProps as any)} />
      }
    : { startIcon: props.startIcon };

  useEffect(() => {
    mountRef.current = true;

    return () => {
      mountRef.current = false;
    };
  }, []);

  const handleClick = async () => {
    try {
      mountRef.current = true;
      setIsPending(true);
      await props.onClick();
    } catch (error) {
      console.log(error);
    }

    if (mountRef.current) {
      setIsPending(false);
    }
  };

  return (
    <Button
      {...props}
      {...pendingProps}
      onClick={handleClick}
      disabled={props.disabled || isPending}
    />
  );
}
