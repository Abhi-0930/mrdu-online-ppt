/// <reference types="next" />
/// <reference types="next/types/global" />
/// <reference types="next/image-types/global" />

declare module 'next' {
  export interface Metadata {
    title?: string | { default: string; template: string };
    description?: string;
    manifest?: string;
    icons?: any;
    [key: string]: any;
  }
  export interface Viewport {
    themeColor?: string;
    width?: string;
    initialScale?: number;
    maximumScale?: number;
    [key: string]: any;
  }
}
