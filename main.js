// INIT
import vkbeautify from "./node_modules/vkbeautify/index.js";
import correlationEngine from "./correlationEngine.js";

function scrubTags(str) {
  if (str === null || str === "") return false;
  else str = str.toString();
  return str.replace(/<[^>]*>/g, "");
}

const OPEN_SPEAK_TAG = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
       xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">`;
const CLOSING_SPEAK_TAG = "</speak>";

// REPRESENTS DATA FROM BACKEND, TEXT WITH SOME SSML DONE
const ssml = `
      No anúncio, Geraldo Rabello convida a família para falar
      sobre
      o empreendimento, menos <prosody pitch="low">Luiza, que estava no Canadá.</prosody> A frase logo se popularizou no Twitter e Facebook, tornando-se
      rapidamente um dos assuntos mais comentados da primeira rede social.`;

const textElt = document.querySelector("#fresh-plain-text");
const outputElt = document.querySelector("#generated-ssml");
textElt.textContent = scrubTags(ssml);

const parser = new DOMParser();
const serializer = new XMLSerializer();

// SSML DOC is primary state object that must sync with user text manipulation
let ssmlDoc = parser.parseFromString(
  OPEN_SPEAK_TAG + ssml + CLOSING_SPEAK_TAG,
  "text/xml"
);
// READOUT shows how SSML doc will serialize
let ssmlDocOutput = serializer.serializeToString(ssmlDoc);
let beautifiedXML = vkbeautify.xml(ssmlDocOutput);
outputElt.innerText = ssmlDocOutput || beautifiedXML;

console.dir(ssmlDoc);

function transpileTextMutation() {
  const map = correlationEngine(textElt.innerText, ssmlDoc.firstElementChild);
  console.log(map);
}

transpileTextMutation();

function checkParity() {
  const ssmlDocTextMap = correlationEngine(ssmlDoc.firstElementChild)
  const userText = textElt.textContent
}
console.log(
  "parity: " + (textElt.textContent === ssmlDoc.firstElementChild.textContent)
);
console.log("textElt.textContent", textElt.textContent);
console.log(
  "ssmlDoc.firstElementChild.textContent",
  ssmlDoc.firstElementChild.textContent
);
