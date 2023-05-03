// This should be called client side to get the client's timezone.
// If this is called server side, it will get the server's timezone (i.e. UTC).


export const localizeDateString = (
  dateString: string | undefined
): string => {
  let localizedString: Date
  if (dateString === undefined) {
    localizedString = new Date()
  } else {
    localizedString = new Date(dateString)
  }
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return localizedString.toLocaleString("en-US", { timeZone: localTimeZone })
}
