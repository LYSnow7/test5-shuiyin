Page({
  data: {
    tempImagePath: '',
    watermarkText: 'Watermark',
    watermarkColor: '#ffffff',
    watermarkSize: 30,
    watermarkOpacity: 0.5,
    watermarkPosition: 'center', // 'topLeft', 'topRight', 'center', 'bottomLeft', 'bottomRight'
    selectedPositionIndex: 2, // 默认选中"居中"
    positions: [
      { name: '左上角', value: 'topLeft' },
      { name: '右上角', value: 'topRight' },
      { name: '居中', value: 'center' },
      { name: '左下角', value: 'bottomLeft' },
      { name: '右下角', value: 'bottomRight' }
    ],
    resultImagePath: '',
    canvasWidth: 300,
    canvasHeight: 300,
    showCanvas: false,
    animationData: {},
    particles: []
  },

  onLoad: function () {
    // 创建动画背景粒子
    this.createParticles();
    
    // 获取系统信息以设置画布大小
    wx.getSystemInfo({
      success: (res) => {
        this.setData({
          canvasWidth: res.windowWidth * 0.9,
          canvasHeight: res.windowWidth * 0.9
        });
      }
    });
    
    // 初始化水印位置索引
    // 确保selectedPositionIndex与默认的watermarkPosition匹配
    const positions = this.data.positions;
    let defaultIndex = 2; // 默认为"居中"
    for (let i = 0; i < positions.length; i++) {
      if (positions[i].value === this.data.watermarkPosition) {
        defaultIndex = i;
        break;
      }
    }
    this.setData({
      selectedPositionIndex: defaultIndex
    });
    
    // 创建动画
    this.animation = wx.createAnimation({
      duration: 1000,
      timingFunction: 'ease',
    });
  },
  
  onShow: function() {
    // 应用动画效果
    this.startAnimation();
  },
  
  startAnimation: function() {
    // 创建一个简单的呼吸效果
    setInterval(() => {
      this.animation.scale(1.02).step();
      this.animation.scale(1).step();
      this.setData({
        animationData: this.animation.export()
      });
    }, 2000);
  },
  
  createParticles: function() {
    // 创建背景粒子效果（这里只是数据，实际渲染在wxml中）
    const particles = [];
    for (let i = 0; i < 20; i++) {
      particles.push({
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        size: Math.random() * 10 + 5,
        animationDuration: Math.random() * 10 + 10 + 's',
        delay: Math.random() * 5 + 's'
      });
    }
    this.setData({ particles });
  },

  // 选择图片
  chooseImage: function () {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 获取图片临时路径
        const tempFilePath = res.tempFilePaths[0];
        
        // 获取图片信息以调整canvas大小
        wx.getImageInfo({
          src: tempFilePath,
          success: (imgInfo) => {
            // 计算合适的canvas尺寸，保持原图比例
            let ratio = imgInfo.width / imgInfo.height;
            let canvasWidth = this.data.canvasWidth;
            let canvasHeight = canvasWidth / ratio;
            
            if (canvasHeight > wx.getSystemInfoSync().windowHeight * 0.6) {
              canvasHeight = wx.getSystemInfoSync().windowHeight * 0.6;
              canvasWidth = canvasHeight * ratio;
            }
            
            this.setData({
              tempImagePath: tempFilePath,
              canvasWidth: canvasWidth,
              canvasHeight: canvasHeight,
              showCanvas: true
            }, () => {
              this.drawWatermark();
            });
          }
        });
      }
    });
  },

  // 文本输入变化
  onTextInput: function (e) {
    this.setData({
      watermarkText: e.detail.value
    });
    if (this.data.tempImagePath) {
      this.drawWatermark();
    }
  },

  // 颜色选择变化
  onColorChange: function (e) {
    const colorIndex = parseInt(e.detail.value);
    const colors = ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const selectedColor = colors[colorIndex];
    
    this.setData({
      watermarkColor: selectedColor
    });
    
    if (this.data.tempImagePath) {
      this.drawWatermark();
    }
  },

  // 字体大小变化
  onSizeChange: function (e) {
    this.setData({
      watermarkSize: e.detail.value
    });
    if (this.data.tempImagePath) {
      this.drawWatermark();
    }
  },

  // 透明度变化
  onOpacityChange: function (e) {
    this.setData({
      watermarkOpacity: e.detail.value / 100
    });
    if (this.data.tempImagePath) {
      this.drawWatermark();
    }
  },

  // 位置变化
  onPositionChange: function (e) {
    // 获取选择的索引
    const index = parseInt(e.detail.value);
    // 获取对应的位置值
    const position = this.data.positions[index].value;
    
    console.log('选择位置:', index, position);
    
    // 先设置索引，以便UI立即更新
    this.setData({
      selectedPositionIndex: index
    });
    
    // 延迟一点设置位置值并重绘，以确保UI更新后再重绘
    setTimeout(() => {
      this.setData({
        watermarkPosition: position
      }, () => {
        if (this.data.tempImagePath) {
          this.drawWatermark();
        }
      });
    }, 50);
  },

  // 绘制水印
  drawWatermark: function () {
    if (!this.data.tempImagePath) return;
    
    const position = this.data.watermarkPosition;
    console.log('开始绘制水印，位置:', position);
    
    const ctx = wx.createCanvasContext('watermarkCanvas');
    const { canvasWidth, canvasHeight, tempImagePath, watermarkText, watermarkColor, watermarkSize, watermarkOpacity } = this.data;

    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // 绘制图片
    ctx.drawImage(tempImagePath, 0, 0, canvasWidth, canvasHeight);
    
    // 设置水印文字样式
    ctx.setFontSize(watermarkSize);
    ctx.setFillStyle(this.hexToRgba(watermarkColor, watermarkOpacity));
    
    // 计算水印位置
    const textWidth = watermarkText.length * watermarkSize * 0.6; // 简化计算文本宽度的方式
    let x = 0;
    let y = 0;
    
    // 根据位置值设置坐标
    switch (position) {
      case 'topLeft':
        x = watermarkSize;
        y = watermarkSize * 1.5;
        break;
      case 'topRight':
        x = canvasWidth - textWidth - watermarkSize;
        y = watermarkSize * 1.5;
        break;
      case 'center':
        x = (canvasWidth - textWidth) / 2;
        y = canvasHeight / 2;
        break;
      case 'bottomLeft':
        x = watermarkSize;
        y = canvasHeight - watermarkSize;
        break;
      case 'bottomRight':
        x = canvasWidth - textWidth - watermarkSize;
        y = canvasHeight - watermarkSize;
        break;
      default:
        // 默认居中
        x = (canvasWidth - textWidth) / 2;
        y = canvasHeight / 2;
    }
    
    console.log('水印坐标:', x, y, '文本宽度:', textWidth);
    
    // 绘制水印文字
    ctx.fillText(watermarkText, x, y);
    
    // 绘制到canvas
    ctx.draw(false, () => {
      // 延迟保存图片，确保canvas已经绘制完成
      setTimeout(() => {
        this.saveWatermarkedImage();
      }, 500);
    });
  },

  // 将HEX颜色转换为RGBA
  hexToRgba: function (hex, opacity) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },

  // 保存带水印的图片
  saveWatermarkedImage: function () {
    wx.canvasToTempFilePath({
      canvasId: 'watermarkCanvas',
      success: (res) => {
        console.log('图片生成成功:', res.tempFilePath);
        this.setData({
          resultImagePath: res.tempFilePath
        });
      },
      fail: (err) => {
        console.error('保存失败', err);
        wx.showToast({
          title: '图片生成失败',
          icon: 'none'
        });
      },
      complete: () => {
        console.log('当前水印位置:', this.data.watermarkPosition, '索引:', this.data.selectedPositionIndex);
      }
    });
  },

  // 保存图片到相册
  saveToAlbum: function () {
    if (!this.data.resultImagePath) {
      wx.showToast({
        title: '请先添加水印',
        icon: 'none'
      });
      return;
    }
    
    wx.saveImageToPhotosAlbum({
      filePath: this.data.resultImagePath,
      success: () => {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('保存到相册失败', err);
        // 如果是因为用户拒绝授权导致的失败
        if (err.errMsg.indexOf('auth deny') >= 0) {
          wx.showModal({
            title: '提示',
            content: '需要您授权保存图片到相册',
            showCancel: false,
            success: () => {
              wx.openSetting({
                success: (settingRes) => {
                  if (settingRes.authSetting['scope.writePhotosAlbum']) {
                    this.saveToAlbum();
                  }
                }
              });
            }
          });
        } else {
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          });
        }
      }
    });
  }
}); 