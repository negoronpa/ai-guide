export interface Spot {
    id: string;
    name: string;
    location: string;
    description_base: string;
    imageUrl: string;
}

export const mockSpots: Record<string, Spot> = {
    "asakusa-temple": {
        id: "asakusa-temple",
        name: "Senso-ji Temple (浅草寺)",
        location: "Asakusa, Tokyo",
        description_base: "Tokyo's oldest temple, founded in 628. Famous for its massive red lantern at Kaminarimon Gate and the bustling Nakamise shopping street.",
        imageUrl: "https://images.unsplash.com/photo-1542931287-023b922fa89b?auto=format&fit=crop&q=80&w=1000",
    },
    "kinkaku-ji": {
        id: "kinkaku-ji",
        name: "Kinkaku-ji (金閣寺)",
        location: "Kyoto",
        description_base: "The Golden Pavilion is a Zen temple in northern Kyoto whose top two floors are completely covered in gold leaf. It was the retirement villa of the shogun Ashikaga Yoshimitsu.",
        imageUrl: "https://images.unsplash.com/photo-1545562095-83c7fb70d23a?auto=format&fit=crop&q=80&w=1000",
    },
};
