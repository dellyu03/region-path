declare module "react-simple-maps" {
  import { ComponentType, ReactNode, SVGProps } from "react";

  interface ProjectionConfig {
    center?: [number, number];
    scale?: number;
    rotate?: [number, number, number];
  }

  interface ComposableMapProps {
    width?: number;
    height?: number;
    projection?: string;
    projectionConfig?: ProjectionConfig;
    style?: React.CSSProperties;
    children?: ReactNode;
  }

  interface GeographiesProps {
    geography: string | object;
    children: (args: { geographies: Geography[] }) => ReactNode;
  }

  interface Geography {
    rsmKey: string;
    properties: Record<string, unknown>;
    geometry: object;
  }

  interface GeographyProps extends SVGProps<SVGPathElement> {
    geography: Geography;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
  }

  export const ComposableMap: ComponentType<ComposableMapProps>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
  export const ZoomableGroup: ComponentType<{ children?: ReactNode; [k: string]: unknown }>;
  export const Marker: ComponentType<{ coordinates: [number, number]; children?: ReactNode; [k: string]: unknown }>;
  export const Line: ComponentType<{ [k: string]: unknown }>;
  export const Graticule: ComponentType<{ [k: string]: unknown }>;
  export const Sphere: ComponentType<{ [k: string]: unknown }>;
}
