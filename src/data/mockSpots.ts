export interface Spot {
    id: string;
    name: string;
    location: string;
    description_base: string;
    imageUrl: string;
}

export const featuredSpots: Spot[] = [
    {
        id: "asakusa-temple",
        name: "Senso-ji Temple (浅草寺)",
        location: "Asakusa, Tokyo",
        description_base: "Tokyo's oldest temple, founded in 628. Famous for its massive red lantern at Kaminarimon Gate and the bustling Nakamise shopping street.",
        imageUrl: "/images/sensoji.jpg",
    },
    {
        id: "kinkaku-ji",
        name: "Kinkaku-ji (金閣寺)",
        location: "Kyoto",
        description_base: "The Golden Pavilion is a Zen temple in northern Kyoto whose top two floors are completely covered in gold leaf. It was the retirement villa of the shogun Ashikaga Yoshimitsu.",
        imageUrl: "/images/kinkakuji.jpg",
    },
];

export const mockSpots: Record<string, Spot> = {
    "asakusa-temple": featuredSpots[0],
    "kinkaku-ji": featuredSpots[1],
    "kinkaku-temple": featuredSpots[1], // URL Alias for robustness
};
