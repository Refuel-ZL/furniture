var utils = {}
var path = require('path')
var qr = require('qr-image')
var PImage = require('pureimage')
var concat = require('concat-stream')
var PNG = require('pngjs').PNG
var Bitmap = require('./bitmap')

/**
 * 加载字体
 */
var fnt = PImage.registerFont(path.join(__dirname, '../../public/font/msyh.ttf'), 'Microsoft YaHei');
// var fnt = PImage.registerFont(path.join(__dirname, '../../public/font/simhei.ttf'), 'SimHei');

/**
 * 根据地址生成二维码
 * 参数 url(string) 地址 option.text 文本
 */
utils.createQr = function(url, option) {

    return new Promise((res, rej) => {
        try {
            var qr_png = qr.image(url, {
                type: 'png',
                margin: 1,
                parse_url: true,
                // size: 7
            })
            let w = parseInt(option['width'] || 256)
            let h = parseInt(option['height'] || 256)
            let text = option['text'] || ''
            qr_png.pipe(new PNG()).on('parsed', function() {
                var bitmap = new Bitmap(this.width, this.height)
                for (var i = 0; i < bitmap.data.length; i++) {
                    bitmap.data[i] = this.data[i]
                }
                var img = bitmap
                var img2 = PImage.make(w, h)

                fnt.load(function() {
                    var c = img2.getContext('2d')
                    c.fillStyle = '#FFFFFF'
                    c.fillRect(0, 0, w, h)
                        //边距
                    let j = 20
                    let w1, h1, x, y, l = 0
                    if (w > h) {
                        l = h
                    } else {
                        l = w
                    }
                    // l 最大的正方体  内部再画二维码带边距j
                    w1 = h1 = l - 2 * j //二维码的宽高
                    x = (w - w1) / 2 //起点位置
                    y = (h - l) / 2
                        // c.strokeRect((w - l) / 2, (h - l) / 2, l, l)//最终画图的区域
                    c.drawImage(img, 0, 0, img.width, img.height, x, y, w1, h1)
                    try {
                        c.font = "18pt 'Microsoft YaHei'"
                        c.fillStyle = '#000000'
                        c.fillText(text, (w - text.length * 15) / 2, (h - l) / 2 - j + l)
                    } catch (error) {
                        console.log(error)
                    }
                    c.textAlign = 'center'
                    c.textBaseline = 'middle'
                    PImage.encodePNGToStream(img2, concat(function(text) {
                        res(text)
                    }))
                })
            })
        } catch (error) {
            rej(error)
        }

    })
}


exports = module.exports = utils