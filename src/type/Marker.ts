export type MarkerType = "MYLOCATION" | "SEARCH" | "CATEGORY"

export interface MarkerProps {
    title: string;
    lat: number;
    lng: number;
    type: MarkerType;
    onClick?: () => void;
}