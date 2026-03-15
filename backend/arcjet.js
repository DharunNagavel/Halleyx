import arcjet, { shield, detectBot, tokenBucket, slidingWindow } from "@arcjet/node";
import { ARCJET } from "./config/env.js";

const aj = arcjet({
    key: ARCJET,
    rules: [
        shield({ mode: "DRY_RUN" }),
        detectBot({ mode: "DRY_RUN", allow: ["CATEGORY:SEARCH_ENGINE"] }),
        slidingWindow({ mode: "DRY_RUN",max:50,interval:60 }),
    ]
});

export default aj;