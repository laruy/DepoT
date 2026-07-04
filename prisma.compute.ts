import { defineComputeConfig } from "@prisma/compute-sdk/config";

export default defineComputeConfig({
  app: {
    name: "DepoT",
    framework: "nextjs",
    env: ".env",
  },
});
