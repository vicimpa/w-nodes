import { audioLoader } from "$library/loader";
export default audioLoader(
  import.meta.glob("./*.ogg")
);
