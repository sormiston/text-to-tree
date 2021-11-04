function walkAndCollectRenderedTextNodes(subtree) {
  const srcList = Array.from(subtree.childNodes);
  let result = [];

  srcList.forEach((srcNode) => {
    if (srcNode.nodeType === Node.TEXT_NODE && /\S/.test(srcNode.textContent)) {
      // if you're here, this is a good entry to map
      result = result.concat(srcNode);
      return;
    }
    if (!srcNode.hasChildNodes()) return;
    else result = result.concat(walkAndCollectRenderedTextNodes(srcNode));
  });

  return result;
}

export function correlationEngine(referenceText, tree, editPoint = null) {
  const targetTNodes = walkAndCollectRenderedTextNodes(tree);
  // targetTNodes will be a FIFO queue through which root.innerText.replaceAll(/(\n)+/g, ' ').split('').map will step through, correlating characters to the text nodes in which they are found.
  const returnData = {
    correlationMap: [],
    selectableTextIdx: null,
  };
  let fromIdx = 0;

  const chars = referenceText.split("");

  for (let [i, c] of chars.entries()) {
    while (targetTNodes.length) {
      let currTNode = targetTNodes[0];
      let localIdx = currTNode.textContent.indexOf(c, fromIdx);
      if (localIdx >= 0) {
        fromIdx = localIdx + 1; // next tick's search starts only after point where this char was found
        if (
          editPoint &&
          editPoint.tnode === currTNode &&
          editPoint.idx === localIdx
        ) {
          returnData.selectableTextIdx = i;
        }
        returnData.correlationMap.push({
          tnode: currTNode,
          idx: localIdx,
          c,
          masterIdx: i,
        });
        break;
      } else {
        if (
          /\s/.test(c) &&
          fromIdx >= currTNode.textContent.length &&
          targetTNodes[1] &&
          !targetTNodes[1].textContent.replace(/[\s\n\r\t]+/, " ").startsWith(c)
        ) {
          // some whitespace will be produced by the browser rendered innerText, but will not actually exist as data in any descendant text node.  Thus, we'll reach this code block to dequeue the text node, but what we really want is to move on to the next word character.  Such "phantom spaces" should not break the algorithm.  Skip them.
          // console.log('phantom space!', `${c.charCodeAt(0)} at idx ${i}`, currTNode)
          returnData.correlationMap.push({
            tnode: currTNode,
            idx: localIdx,
            note: "phantom space",
          });
          break;
        }
        // must leave an unconditioned case to avoid infinite loop
        targetTNodes.shift();
        fromIdx = 0;
      }
    }
    continue;
  }
  return returnData;
}

export function organizeMap(correlationMap) {
  let result = {};
  let currentVolume = [correlationMap[0]];
  let start = 0;

  function finishVolume(entry, start, i, isLast = false) {
    const rangeKey = `${start}-${i - 1}`;
    if (isLast) {
      currentVolume.push(entry);
    }
    result[rangeKey] = currentVolume;
    if (!isLast) {
      currentVolume = [entry];
      start = i;
    }
  }
  correlationMap.forEach((entry, i, arr) => {
    if (i === 0) return;
    if (i === arr.length - 1) {
      finishVolume(entry, start, i, true);
    } else if (entry.tnode === arr[i - 1].tnode) {
      currentVolume.push(entry);
    } else {
      finishVolume(entry, start, i);
    }
  });
  return result;
}
