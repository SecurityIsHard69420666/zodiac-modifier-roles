import { expect, it, suite } from "vitest"
import { AbiCoder, concat, hexlify, zeroPadValue } from "ethers"
import { Allowance } from "zodiac-roles-deployments"

import { applyAllowances } from "./allowances"

import { Roles__factory } from "../../evm/typechain-types"

const iface = Roles__factory.createInterface()

const key1 = hexlify(zeroPadValue("0x01", 32)) as `0x${string}`
const key2 = hexlify(zeroPadValue("0x02", 32)) as `0x${string}`
const key3 = hexlify(zeroPadValue("0x03", 32)) as `0x${string}`
const key4 = hexlify(zeroPadValue("0x04", 32)) as `0x${string}`

suite("applyAllowances", () => {
  suite("replace", () => {
    it("unsets allowances that are not mentioned, and sets the ones passed in", async () => {
      const currentAllowances: Allowance[] = [
        {
          key: key1,
          balance: 1n,
          maxRefill: 2n,
          refill: 3n,
          period: 4n,
          timestamp: 5n,
        },
        {
          key: key2,
          balance: 6n,
          maxRefill: 7n,
          refill: 8n,
          period: 9n,
          timestamp: 10n,
        },
      ]

      const allowances: Allowance[] = [
        {
          key: key3,
          balance: 16n,
          maxRefill: 17n,
          refill: 18n,
          period: 19n,
          timestamp: 20n,
        },
      ]

      const result = await applyAllowances(allowances, {
        currentAllowances,
        mode: "replace",
      })

      expect(result).to.deep.equal([
        encodeUnsetAllowance(currentAllowances[0]),
        encodeUnsetAllowance(currentAllowances[1]),
        encodeSetAllowance(allowances[0]),
      ])
    })

    it("unsets all allowances when passed an empty array", async () => {
      const currentAllowances: Allowance[] = [
        {
          key: key1,
          balance: 1n,
          maxRefill: 2n,
          refill: 3n,
          period: 4n,
          timestamp: 5n,
        },
        {
          key: key2,
          balance: 6n,
          maxRefill: 7n,
          refill: 8n,
          period: 9n,
          timestamp: 10n,
        },
      ]

      const result = await applyAllowances([], {
        currentAllowances,
        mode: "replace",
      })

      expect(result).to.deep.equal([
        encodeUnsetAllowance(currentAllowances[0]),
        encodeUnsetAllowance(currentAllowances[1]),
      ])
    })

    it("when overlapping, it preserves timestamp and balance", async () => {
      const currentAllowances: Allowance[] = [
        {
          key: key1,
          balance: 1n,
          maxRefill: 1n,
          refill: 1n,
          period: 1n,
          timestamp: 1n,
        },
        {
          key: key2,
          balance: 2n,
          maxRefill: 2n,
          refill: 2n,
          period: 2n,
          timestamp: 2n,
        },
      ]

      const allowances: Allowance[] = [
        {
          key: key2,
          balance: 3n,
          maxRefill: 3n,
          refill: 3n,
          period: 3n,
          timestamp: 3n,
        },
        {
          key: key3,
          balance: 4n,
          maxRefill: 4n,
          refill: 4n,
          period: 4n,
          timestamp: 4n,
        },
      ]

      const result = await applyAllowances(allowances, {
        currentAllowances,
        mode: "replace",
      })

      expect(result).to.deep.equal([
        encodeUnsetAllowance(currentAllowances[0]),
        encodeSetAllowance({
          key: key2,
          balance: 2n,
          maxRefill: 3n,
          refill: 3n,
          period: 3n,
          timestamp: 2n,
        }),
        encodeSetAllowance(allowances[1]),
      ])
    })
  })

  suite("extend", () => {
    it("sets the allowances passed in, and ignores existing ones", async () => {
      const currentAllowances: Allowance[] = [
        {
          key: key1,
          balance: 1n,
          maxRefill: 2n,
          refill: 3n,
          period: 4n,
          timestamp: 5n,
        },
        {
          key: key2,
          balance: 6n,
          maxRefill: 7n,
          refill: 8n,
          period: 9n,
          timestamp: 10n,
        },
      ]

      const allowances: Allowance[] = [
        {
          key: key3,
          balance: 11n,
          maxRefill: 12n,
          refill: 13n,
          period: 14n,
          timestamp: 15n,
        },
        {
          key: key4,
          balance: 16n,
          maxRefill: 17n,
          refill: 18n,
          period: 19n,
          timestamp: 20n,
        },
      ]

      const result = await applyAllowances(allowances, {
        currentAllowances,
        mode: "extend",
      })

      expect(result).to.deep.equal([
        encodeSetAllowance(allowances[0]),
        encodeSetAllowance(allowances[1]),
      ])
    })

    it("sets the allowances passed in, with no previously existing allowances", async () => {
      const currentAllowances: Allowance[] = []

      const allowances: Allowance[] = [
        {
          key: key3,
          balance: 11n,
          maxRefill: 12n,
          refill: 13n,
          period: 14n,
          timestamp: 15n,
        },
        {
          key: key4,
          balance: 16n,
          maxRefill: 17n,
          refill: 18n,
          period: 19n,
          timestamp: 20n,
        },
      ]

      const result = await applyAllowances(allowances, {
        currentAllowances,
        mode: "extend",
      })

      expect(result).to.deep.equal([
        encodeSetAllowance(allowances[0]),
        encodeSetAllowance(allowances[1]),
      ])
    })
  })

  suite("remove", () => {
    it("unsets the allowances passed in, and ignores existing ones", async () => {
      const currentAllowances: Allowance[] = [
        {
          key: key1,
          balance: 1n,
          maxRefill: 2n,
          refill: 3n,
          period: 4n,
          timestamp: 5n,
        },
        {
          key: key2,
          balance: 6n,
          maxRefill: 7n,
          refill: 8n,
          period: 9n,
          timestamp: 10n,
        },
      ]

      const allowances: Allowance[] = [
        {
          key: key3,
          balance: 11n,
          maxRefill: 12n,
          refill: 13n,
          period: 14n,
          timestamp: 15n,
        },
        {
          key: key4,
          balance: 16n,
          maxRefill: 17n,
          refill: 18n,
          period: 19n,
          timestamp: 20n,
        },
      ]

      const result = await applyAllowances(allowances, {
        currentAllowances,
        mode: "remove",
      })

      expect(result).to.deep.equal([
        encodeUnsetAllowance(allowances[0]),
        encodeUnsetAllowance(allowances[1]),
      ])
    })
  })
})

function encodeSetAllowance(allowance: {
  key: `0x${string}`
  balance: bigint
  maxRefill: bigint
  refill: bigint
  period: bigint
  timestamp: bigint
}) {
  const selector = iface.getFunction("setAllowance").selector
  const encoded = AbiCoder.defaultAbiCoder().encode(
    ["bytes32", "uint256", "uint256", "uint256", "uint256", "uint256"],
    [
      allowance.key,
      allowance.balance,
      allowance.maxRefill,
      allowance.refill,
      allowance.period,
      allowance.timestamp,
    ]
  )

  return concat([selector, encoded])
}

function encodeUnsetAllowance(allowance: {
  key: `0x${string}`
  balance: bigint
  maxRefill: bigint
  refill: bigint
  period: bigint
  timestamp: bigint
}) {
  const selector = iface.getFunction("setAllowance").selector
  const encoded = AbiCoder.defaultAbiCoder().encode(
    ["bytes32", "uint256", "uint256", "uint256", "uint256", "uint256"],
    [allowance.key, 0, 0, 0, 0, 0]
  )

  return concat([selector, encoded])
}
