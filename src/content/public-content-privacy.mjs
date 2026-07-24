const ipv4CandidatePattern =
  /(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])/gu

/** @param {string} candidate */
export const isValidIpv4Candidate = candidate => {
  const octets = candidate.split(".")

  return (
    octets.length === 4 &&
    octets.every(
      octet =>
        /^(?:0|[1-9]\d{0,2})$/u.test(octet) &&
        Number(octet) >= 0 &&
        Number(octet) <= 255,
    )
  )
}

/** @param {string} address */
export const isPrivateIpv4Address = address => {
  const [first, second] = address.split(".").map(Number)

  return (
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  )
}

/**
 * @param {string} text
 * @param {(candidate: string) => boolean} [isValidAddress]
 */
export const findPrivateIpv4Addresses = (
  text,
  isValidAddress = isValidIpv4Candidate,
) =>
  (text.match(ipv4CandidatePattern) ?? []).filter(
    candidate =>
      isValidAddress(candidate) && isPrivateIpv4Address(candidate),
  )
