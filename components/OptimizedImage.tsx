'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

export function OptimizedImage(props: ImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <img
        src={props.src as string}
        alt={props.alt ?? ''}
        width={props.width}
        height={props.height}
        style={{
          width: '100%',
          height: 'auto',
          maxWidth: props.width,
        }}
      />
    );
  }

  return (
    <Image
      {...props}
      alt={props.alt}
      onError={() => setHasError(true)}
    />
  );
}
