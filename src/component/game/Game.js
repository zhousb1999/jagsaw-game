import React, { useState, useMemo } from 'react'
import Plate from '../plate/Plate'
import Layer from '../layer/Layer'
import Timer from '../timer/Timer'

import './game.css'

const plateWidth = 79.6 //减去碎片边框


export const FLAG_INIT = 0,
    FLAG_START = 1,
    FLAG_END = 10,
    FLAG_OVER_TIME = 11


// 关卡组
const levels = [
    {
        xnum: 3,
        ynum: 3,
        url: 'http://www.zhousb.cn/upload/jagsaw/1.jpg',
        seconds: 10
    }, {
        xnum: 4,
        ynum: 4,
        url: 'http://www.zhousb.cn/upload/jagsaw/1.jpg',

        seconds: 25
    }
]


// 临时变量
var xstart, ystart,  // 点击开始位置
    layerPatch,
    _layerStyle,
    patchsField         // 碎片位置

const Game = () => {

    const [flag, setFlag] = useState(FLAG_INIT),
        [level, setLevel] = useState(0),
        [layerStyle, setLayerStyle] = useState(null),
        [patchs, setPatchs] = useState(null)

    // 选择关卡
    let { xnum, ynum, url, seconds } = levels[level]


    function handleTouchStart({ target, changedTouches }) {

        // 初始化碎片位置
        if (!patchsField) {
            patchsField = []
            for (var patch of target.parentNode.children) {
                let { top, left, width, height } = patch.getBoundingClientRect()
                patchsField.push({
                    top,
                    left,
                    width,
                    height
                })
            }
        }


        // 未开始 || 只有一根手指
        if (FLAG_START !== flag || 1 !== changedTouches.length) {
            return false
        }

        xstart = changedTouches[0].pageX
        ystart = changedTouches[0].pageY

        let { top, left, width, height } = target.getBoundingClientRect()
        let { backgroundImage, backgroundPosition } = target.style

        layerPatch = {
            sort: target.getAttribute('sort'),
            index: target.getAttribute('index'),
            style: _layerStyle = {
                top,
                left,
                width,
                height,
                backgroundImage,
                backgroundPosition,
            }
        }
        setLayerStyle(_layerStyle)
    }

    function handleTouchMove({ changedTouches }) {
        if (FLAG_START !== flag || 1 !== changedTouches.length) {
            return false
        }

        let { pageX: xnow, pageY: ynow } = changedTouches[0]
        _layerStyle = copy(_layerStyle)
        _layerStyle.top = ynow - (ystart - layerPatch.style.top)
        _layerStyle.left = xnow - (xstart - layerPatch.style.left)
        setLayerStyle(_layerStyle)
    }

    function handleTouchEnd() {

        if (FLAG_START !== flag) {
            return false
        }

        // 元素中间轴
        let { top: y, left: x } = _layerStyle
        x += _layerStyle.width / 2
        y += _layerStyle.height / 2


        // 移除浮层
        setLayerStyle(null)
        let newPatchs


        // 交换碎片
        for (var i = 0; i < patchsField.length; i++) {
            let patch = patchsField[i],
                { top, left } = patch,
                bottom = top + patch.height,
                right = left + patch.width

            if (left < x && right > x && top < y & bottom > y) {

                let index = parseInt(layerPatch.index)
                if (i === index) {
                    return
                }

                newPatchs = copy(patchs)


                newPatchs[index].style.backgroundPosition = newPatchs[i].style.backgroundPosition
                newPatchs[i].style.backgroundPosition = layerPatch.style.backgroundPosition

                newPatchs[index].sort = newPatchs[i].sort
                newPatchs[i].sort = parseInt(layerPatch.sort)

                setPatchs(newPatchs)
                break
            }
        }


        // 没有交换
        if (!newPatchs) {
            return
        }


        // 校验排序
        let sorted = 0
        for (let patch of newPatchs) {
            if (sorted !== patch.sort) {
                return
            }
            sorted++
        }

        // 通过
        setFlag(FLAG_INIT)
        setLevel(1 + level)
        patchsField = null
    }


    function overtime() {
        console.log('over time')
        setFlag(FLAG_OVER_TIME)
    }



    useMemo(() => {
        let tmpactchs = []

        switch (flag) {
            case FLAG_INIT:     // 初始化拼图

                let sort = 0,
                    width = `${plateWidth / xnum}vw`, // 100 - 4个border
                    height = `${plateWidth / ynum}vw`,
                    backgroundImage = `url(${url})`

                Array(xnum).fill().map((xitem, x) =>
                    Array(ynum).fill().map((yitem, y) => {
                        tmpactchs.push({
                            sort,
                            style: {
                                width,
                                height,
                                backgroundImage,
                                backgroundPosition: `${-y * plateWidth / xnum}vw ${-x * plateWidth / ynum}vw` // 80 - 0.4的border
                            }
                        })
                        return sort++
                    })
                )

                setPatchs(tmpactchs)
                setTimeout(() => {

                    setFlag(FLAG_START)
                }, 3000)
                return

            case FLAG_START:     // 开始游戏

                tmpactchs = copy(patchs)
                shuffle(tmpactchs)
                setPatchs(tmpactchs)
                return
        }
    }, [flag])




    const plate = useMemo(() => {
        return (
            <Plate
                patchs={patchs}
                handleTouchStart={handleTouchStart}
                handleTouchMove={handleTouchMove}
                handleTouchEnd={handleTouchEnd}
            />)
    }, [patchs]),

        layer = useMemo(() =>
            layerStyle && <Layer style={layerStyle} />
            , [layerStyle])

    return (
        <>
            <div className='header'>
                <div className='level'>{1 + level} / {levels.length}</div>
            </div>
            {plate}
            {layer}
            <Timer
                flag={flag}
                seconds={seconds}
                overtime={overtime}
            />

        </>
    )
}


function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}


function shuffle(arr) {
    let i = arr.length;
    while (--i) {
        let j = Math.floor(Math.random() * i);
        [arr[j], arr[i]] = [arr[i], arr[j]];
    }
}


export default Game