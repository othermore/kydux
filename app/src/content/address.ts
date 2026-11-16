// The one place an address under content/ is made (D230): the file's path, with the
// world's stamp, which covers every file shipped there, so that the friends' server
// keeps it for good and a new build, changing the stamp, changes the address.

/** The address of a file under content/, by its path there (`course.json`,
 * `art/things/ring.webp`), with the world's stamp. */
export function contentUrl(path: string): string {
  return `${import.meta.env.BASE_URL}content/${path}?v=${__WORLD_STAMP__}`;
}
