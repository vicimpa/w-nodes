import { cached } from "../lib/cached";
import or from "./or";
import uint from "./uint";

export default cached(() => (
  or(uint(8), uint(16), uint(32))
));