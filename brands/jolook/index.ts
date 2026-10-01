import type { BrandModule } from "@/core/brand/module";
import { brand } from "./brand";
import { commerce } from "./commerce";
import { content } from "./content";
import { fonts } from "./fonts";

const mod: BrandModule = { brand, content, commerce, fonts };
export default mod;
export { brand, commerce, content, fonts };
