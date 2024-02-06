import { fromBase58 } from "../util/base58";

export async function generateKey() {
  return await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 128,
    },
    true,
    ["encrypt", "decrypt"],
  );
}

export async function encrypt(text: string, pin = ''): Promise<{ encrypted: Uint8Array; iv: Uint8Array; key: Uint8Array }> {
  const key = await generateKey();

  const iv = crypto.getRandomValues(new Uint8Array(16));

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    new TextEncoder().encode(text),
  );



  const exportedKey = await crypto.subtle.exportKey("raw", key);

  let scrambledKey;

  if (pin) {
      scrambledKey = scrambleKey(new Uint8Array(exportedKey), pin);
  }

    return {
    encrypted: new Uint8Array(encryptedBuffer),
    key: scrambledKey || new Uint8Array(exportedKey),
    iv,
  };
}

export async function decrypt(encrypted: string, keyData: Uint8Array, iv: string, keyVersion: number, pin = ''): Promise<string> {
  const algorithm = keyVersion === 1 ? "AES-CBC" : "AES-GCM";

  if (pin) {
      keyData = unScrambleKey(keyData, pin);
  }

  const key = await crypto.subtle.importKey("raw", keyData, { name: algorithm, length: 128 }, false, ["decrypt"]);

  try {
      const decrypted = await crypto.subtle.decrypt(
          {
              name: algorithm,
              iv: fromBase58(iv),
          },
          key,
          fromBase58(encrypted),
      );

      return new TextDecoder().decode(decrypted);
  } catch (error) {
      console.log('error, pin issue?');
  }
    return '';
}

function scrambleKey(inputKey: Uint8Array, pin: string, scramble = true): Uint8Array {
    let outputKey = [];

    for (let i = 0; i < inputKey.length; i++) {
        const number: number = Number(inputKey[i]);
        const scrumbleFactor = Number(pin[i % pin.length].charCodeAt(0));

        let newItem;

        if (scramble) {
            newItem = Number(number + scrumbleFactor);
            newItem = newItem > 255 ? newItem - 255 : newItem;
        } else {
            newItem = Number(number - scrumbleFactor);
            newItem = newItem < 0 ? newItem + 255 : newItem;
        }

        outputKey.push(newItem);
    }

    return new Uint8Array(outputKey);
}

function unScrambleKey(scrambledKey: Uint8Array, pin: string): Uint8Array {
    return scrambleKey(scrambledKey, pin, false);
}