// 将文件以字节为单位的转换为其他单位
export default {
    size2Str: (limit) => {
        var size = "";
        if (limit < 0.1 * 1024) { //小于0.1KB，则转化成B
            size = limit.toFixed(2) + "B"
        } else if (limit < 0.1 * 1024 * 1024) { //小于0.1MB，则转化成KB
            size = (limit / 1024).toFixed(2) + "KB"
        } else if (limit < 0.1 * 1024 * 1024 * 1024) { //小于0.1GB，则转化成MB
            size = (limit / (1024 * 1024)).toFixed(2) + "MB"
        } else { //其他转化成GB
            size = (limit / (1024 * 1024 * 1024)).toFixed(2) + "GB"
        }
        var sizeStr = size + ""; //转成字符串
        var index = sizeStr.indexOf("."); //获取小数点处的索引
        var dou = sizeStr.substr(index + 1, 2) //获取小数点后两位的值
        if (dou == "00") { //判断后两位是否为00，如果是则删除00               
            return sizeStr.substring(0, index) + sizeStr.substr(index + 3, 2)
        }
        return size;
    },

    /**
     * 日期格式化
     * @param {Date|string} date 日期对象或日期字符串
     * @param {string} format 格式化模式，如：'yyyy-MM-dd HH:mm:ss'
     * @returns {string} 格式化后的日期字符串
     */
    formatDate: (date, format = 'yyyy-MM-dd HH:mm:ss') => {
        if (!date) return '';
        
        // 如果是字符串，转换为日期对象
        if (typeof date === 'string') {
            date = new Date(date);
        }
        
        const o = {
            'M+': date.getMonth() + 1,                 // 月份
            'd+': date.getDate(),                      // 日
            'H+': date.getHours(),                     // 小时
            'm+': date.getMinutes(),                   // 分
            's+': date.getSeconds(),                   // 秒
            'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
            'S': date.getMilliseconds()                // 毫秒
        };

        if (/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, 
                (date.getFullYear() + '').substr(4 - RegExp.$1.length));
        }

        for (let k in o) {
            if (new RegExp('(' + k + ')').test(format)) {
                format = format.replace(RegExp.$1,
                    RegExp.$1.length === 1 ? o[k] : 
                        ('00' + o[k]).substr(('' + o[k]).length));
            }
        }

        return format;
    },
}