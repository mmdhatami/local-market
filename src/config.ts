export const APP_CONFIG = {
  name: "بازار",
  version: "1.0.0",
  environment: "development",

  categories: {
    buySell: "buy-sell",
    services: "services",
    businesses: "businesses",
    jobs: "jobs",
    realEstate: "real-estate",
    vehicles: "vehicles",
    agriculture: "agriculture",
    rent: "rent"
  },

  location: {
    defaultRadiusKm: 5,
    availableRadiusKm: [0.5, 1, 2, 5]
  }
} as const;
