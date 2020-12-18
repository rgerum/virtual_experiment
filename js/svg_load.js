function waitForElement(parent) {
    return new Promise((resolve, reject) => {
        function test() {
            if (!parent.firstChild) {
                window.requestAnimationFrame(test);
            } else {
                resolve();
            }
        }
        test();
    });
}
async function loadSvg(filename, node) {
    var node_d3 = d3.select(node);
    var node = document.querySelector(node);
    await d3.xml(filename).then(data => node.append(data.documentElement));
    await waitForElement(node);
    return node_d3.select("svg");
}

function waitForElementInDoc(element) {
    return new Promise((resolve, reject) => {
        function test() {
            if (!element.parentElement) {
                window.requestAnimationFrame(test);
            } else {
                resolve();
            }
        }
        test();
    });
}

async function replaceImgWithSvg(node) {
    var node_d3 = d3.select(node);
    var node = node_d3.node();
    let data = await d3.xml(node.src)
    let new_node = data.documentElement
    new_node.style.cssText = node.style.cssText;
    node.parentElement.replaceChild(new_node, node);
    await waitForElement(new_node);
    return d3.select(new_node);
}