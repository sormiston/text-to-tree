// INIT
import vkbeautify from "./node_modules/vkbeautify/index.js";
import { correlationEngine, organizeMap } from "./correlationEngine.js";

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
function printXMLString() {
  let ssmlDocOutput = serializer.serializeToString(ssmlDoc);
  let beautifiedXML = vkbeautify.xml(ssmlDocOutput);
  outputElt.innerText = ssmlDocOutput || beautifiedXML;
}
printXMLString();
console.dir(ssmlDoc);

// Can we successfully map between the de-tagged user text and the XML tree ?
let logs = true;
let mapState

textElt.addEventListener("click", (e) => {
  const selectableTextIdx = getSelectableTextIdx();
  getTextNodeInXMLDoc(textElt.innerText, selectableTextIdx);
});
// ***************************
function getSelectableTextIdx() {
  const sel = window.getSelection();
  const { selectableTextIdx } = correlationEngine(textElt.innerText, textElt, {
    tnode: sel.anchorNode,
    idx: sel.anchorOffset,
  });
  return selectableTextIdx;
} // ************************

// ****************************
function getTextNodeInXMLDoc(selectableText, indexInText) {
  const { correlationMap } = correlationEngine(
    selectableText,
    ssmlDoc.firstElementChild
  );
  const tagNodeInDoc = correlationMap[indexInText];
  logs &&
    console.dirxml({
      tag: tagNodeInDoc.tnode.parentElement,
      value: tagNodeInDoc.tnode.textContent,
      node: tagNodeInDoc.tnode,
    });
  mapState = correlationMap
  console.log(correlationMap)
  console.log(organizeMap(correlationMap))
  return tagNodeInDoc.tnode;
} // ****************************

function checkParity() {
  console.log(
    "parity: " + (textElt.textContent === ssmlDoc.firstElementChild.textContent)
  );
}

// Can we map mutations of text between the de-tagged user text and the XML tree?

function mutationCallback(mutationList, observer) {
  mutationList.forEach((mutation) => {
    switch (mutation.type) {
      case "characterData":
        const newValue = mutation.target.textContent;
         const { oldValue } = mutation;
        // const charDelt =
        //   Math.max(newValue.length, oldValue.length) -
        //   Math.min(newValue.length, oldValue.length);
        const selectableTextIdx = getSelectableTextIdx();
        const textNodeInXMLDoc = getTextNodeInXMLDoc(oldValue, selectableTextIdx);
        console.log(textNodeInXMLDoc)
        // textNodeInXMLDoc.textContent = newValue;
        // printXMLString();
        // checkParity();
    }
  });
}
const observer = new MutationObserver(mutationCallback);
observer.observe(textElt, {
  subtree: true,
  characterData: true,
  characterDataOldValue: true,
});
