enum RichTextTagEnum {
    normal,
    tag,
    selfClosedTag,
    tabsTag,
}

interface BlockItem {
    type: RichTextTagEnum;
    content: string;
    tags: string[];
}

type Block = BlockItem | null;

interface TagDataContentItem {
    idx: number;
    content: string;
}

interface TagData {
    isClose: boolean;
    tagName: string;
    prevTag: TagData | null;
    contents: TagDataContentItem[];
}

/**
 * @description 根据tagStack中的结构，构建返回值
 */
const buildResultByTagData = (tagData: TagData | null, result: Block[]) => {
    const tagList: string[] = [];
    tagData?.isClose && tagList.push(tagData.tagName);
    let prevTag = tagData?.prevTag;
    while (prevTag) {
        prevTag.isClose && tagList.unshift(prevTag.tagName);
        prevTag = prevTag.prevTag;
    }

    tagData?.contents.forEach((item) => {
        result[Number(item.idx)] = {
            type: tagList.length ? RichTextTagEnum.tag : RichTextTagEnum.normal,
            content: item.content,
            tags: tagList,
        };
    });
};

/**
 * @description 支持嵌套标签富文本解析
 * @param {string} text
 */
export function parseRichText(text: string): Block[] {
    const result: Block[] = [];
    const tagStack: TagData[] = [];
    // 已匹配的标签数据，临时保存
    let tagResult = [];
    let cursor = 0;
    let content = '';
    let tagName = '';
    let currentMathTag: TagData | null = null;
    // 循环，构建按标签的分组
    while (cursor < text.length) {
        if (text[cursor] === '<') {
            // 还有在匹配的标签
            if (tagStack.length) {
                // 占位
                result.push(null);
                currentMathTag = tagStack[tagStack.length - 1];
                currentMathTag.contents.push({
                    idx: result.length - 1,
                    content,
                });
            } else {
                // 没有在匹配的标签
                content &&
                    result.push({
                        content,
                        type: RichTextTagEnum.normal,
                        tags: [],
                    });
            }

            content = '';
            cursor += 1;
            // 匹配到标签闭合位置
            while (cursor < text.length && text[cursor] !== '>') {
                tagName += text[cursor];
                cursor++;
            }
            //  闭合标签
            if (tagName.length > 1 && tagName[0] === '/') {
                tagName = tagName.slice(1);
                // 标签匹配
                if (tagName === tagStack[tagStack.length - 1].tagName) {
                    // 弹出已匹配的标签
                    currentMathTag = tagStack.pop()!;
                    currentMathTag.isClose = true;
                    tagResult.push(currentMathTag);
                } else {
                    // TODO: 考虑处理只有开标签的问题例如 test<a>123<b>456</a>
                    // 当前获得的标签，与栈最后一个不匹配，当做普通字符串处理
                    content += `</${tagName}>`;
                }
                // 自闭合标签
            } else if (tagName.length > 1 && tagName[tagName.length - 1] === '/') {
                result.push({
                    type: RichTextTagEnum.selfClosedTag,
                    tags: [tagName.slice(0, tagName.length - 1)],
                    content: '',
                });
            } else if (tagName && tagName[0] !== '/') {
                // 匹配到开始标签，存入到栈中
                tagStack.push({
                    // 是否闭合
                    isClose: false,
                    // 该标签下的内容
                    contents: [],
                    // 标签名称
                    tagName,
                    // 指向之前的标签匹配元素
                    prevTag: tagStack.length ? tagStack[tagStack.length - 1] : null,
                });
            }
            tagName = '';
            cursor++;
        } else {
            content += text[cursor];
            cursor++;
        }
    }
    // 还有 content
    content &&
        result.push({
            content,
            type: RichTextTagEnum.normal,
            tags: [],
        });
    tagResult = tagResult.concat(tagStack);
    // 处理所有的标签分组数据
    tagResult.forEach((item) => buildResultByTagData(item, result));
    return result;
}

export default parseRichText;
