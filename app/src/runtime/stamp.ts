// Whether the world a page runs is the one it was built with: a browser that
// kept an older world.zip, or a server that packed a newer one since the page
// was loaded, would run levels the page does not match.

/** Whether the running world's stamp, as the worker read it from world.zip, is
 * another than the page's: a world with no stamp is another too. */
export function staleWorld(page: string, world: string | undefined): boolean {
  return !world || world !== page;
}
