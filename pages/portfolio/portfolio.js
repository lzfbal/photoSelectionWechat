// pages/portfolio/portfolio.js
const app = getApp(); // 获取全局应用实例

Page({
    data: {
        BACKEND_URL: '', // 从 app.js globalData 获取
        isLoading: true, // 是否显示加载中
        isError: false,  // 是否显示错误信息
        errorMessage: '',// 错误信息内容
        noItems: false,  // 是否显示没有作品
        allPortfolioItems: [], // 存储所有作品数据
        filteredPortfolioItems: [], // 当前显示的作品数据（根据分类筛选）
        categories: [], // 分类按钮数据 { category: '...', name: '...', active: true/false }
        activeCategory: 'all', // 当前激活的分类
        gridVisible: false, // 控制作品网格的淡入淡出效果
        // showModal: false, // 移除自定义模态框相关数据
        // modalImageUrl: ''
    },

    // 页面加载生命周期函数
    onLoad() {
        this.setData({
            BACKEND_URL: app.globalData.BACKEND_URL // 从全局数据中获取后端URL
        });
        this.loadPortfolio('all', true); // 初始加载所有作品
    },

    /**
     * 辅助函数：显示特定消息并隐藏网格
     * @param {string} type - 消息类型 ('loading', 'error', 'noItems')
     * @param {string} message - 错误消息内容 (仅当 type 为 'error' 时有效)
     */
    showPortfolioMessage(type, message = '') {
        this.setData({
            isLoading: false,
            isError: false,
            noItems: false,
            gridVisible: false, // 隐藏网格，为显示消息做准备
        });

        if (type === 'loading') {
            this.setData({ isLoading: true });
        } else if (type === 'error') {
            this.setData({ isError: true, errorMessage: message });
        } else if (type === 'noItems') {
            this.setData({ noItems: true });
        }
    },

    // 辅助函数：隐藏所有消息
    hideAllPortfolioMessages() {
        this.setData({
            isLoading: false,
            isError: false,
            noItems: false
        });
    },

    /**
     * 填充分类筛选器按钮的数据
     * @param {Array} items - 所有作品数据
     */
    populateCategoryFilter(items) {
        const categoriesSet = new Set(items.map(item => item.category).filter(cat => cat));
        const categoriesArray = [{ 
            category: 'all', 
            name: '所有分类', 
            active: this.data.activeCategory === 'all' 
        }];

        categoriesSet.forEach(category => {
            categoriesArray.push({
                category: category,
                name: category, // 如果需要，这里可以做分类名称的翻译
                active: this.data.activeCategory === category
            });
        });

        this.setData({
            categories: categoriesArray
        });
    },

    /**
     * 加载作品集数据
     * @param {string} category - 要加载的分类，'all' 表示所有
     * @param {boolean} isInitialLoad - 是否是首次加载（控制加载提示的显示）
     */
    async loadPortfolio(category = 'all', isInitialLoad = true) {
        if (isInitialLoad) {
            this.showPortfolioMessage('loading'); // 首次加载显示“加载中”
        } else {
            // 对于分类切换，先触发网格淡出效果
            this.setData({ gridVisible: false });
            this.hideAllPortfolioMessages(); // 隐藏其他消息
        }

        const BACKEND_URL = this.data.BACKEND_URL;
        if (!BACKEND_URL) {
            this.showPortfolioMessage('error', '后端URL未配置，请检查app.js。');
            return;
        }

        wx.request({
            url: `${BACKEND_URL}/portfolio`,
            method: 'GET',
            success: (res) => {
                const data = res.data;
                if (data.code === 0) {
                    const allItems = data.portfolioItems || [];
                    this.setData({ allPortfolioItems: allItems });
                    this.populateCategoryFilter(allItems); // 更新分类标签

                    let itemsToDisplay = allItems;
                    if (category !== 'all') {
                        itemsToDisplay = allItems.filter(item => item.category === category);
                    }

                    if (itemsToDisplay.length === 0) {
                        // 如果特定分类或所有分类下都没有作品
                        this.showPortfolioMessage('noItems');
                        this.setData({ filteredPortfolioItems: [] }); // 清空显示列表
                    } else {
                        this.hideAllPortfolioMessages(); // 隐藏加载/错误/无作品消息
                        this.setData({ filteredPortfolioItems: itemsToDisplay });
                        // 延迟设置 gridVisible 为 true，确保数据更新和 WXML 渲染完成后再触发淡入
                        setTimeout(() => {
                            this.setData({ gridVisible: true });
                        }, 50); // 短暂延迟，确保渲染完成
                    }

                } else {
                    this.showPortfolioMessage('error', data.message || '获取作品集失败，请稍后再试。');
                }
            },
            fail: (err) => {
                console.error('获取作品集网络错误:', err);
                this.showPortfolioMessage('error', '网络请求失败，请检查网络连接。');
            },
            complete: () => {
                // 请求完成，无论成功失败，showPortfolioMessage 已经处理了加载状态的隐藏
            }
        });
    },

    // 重试按钮点击事件
    retryLoad() {
        this.loadPortfolio('all', true); // 重试时总是加载所有作品
    },

    // 分类标签点击事件
    handleCategoryTap(e) {
        const selectedCategory = e.currentTarget.dataset.category;
        const currentActiveCategory = this.data.activeCategory;

        if (selectedCategory === currentActiveCategory) {
            return; // 如果点击的是当前已激活的分类，则不做任何操作
        }

        // 更新激活的分类
        this.setData({
            activeCategory: selectedCategory
        });

        // 重新更新分类按钮的 active 状态
        this.populateCategoryFilter(this.data.allPortfolioItems);

        // 触发作品网格的淡出效果
        this.setData({ gridVisible: false });

        // 等待淡出动画完成 (0.3s)，然后更新内容并触发淡入
        setTimeout(() => {
            let filtered = [];
            if (selectedCategory === 'all') {
                filtered = this.data.allPortfolioItems;
            } else {
                filtered = this.data.allPortfolioItems.filter(item => item.category === selectedCategory);
            }

            if (filtered.length === 0) {
                this.showPortfolioMessage('noItems'); // 如果筛选后没有作品，显示“没有作品”消息
                this.setData({ filteredPortfolioItems: [] }); // 清空显示列表
            } else {
                this.hideAllPortfolioMessages(); // 隐藏任何可能的“没有作品”消息
                this.setData({ filteredPortfolioItems: filtered });
                // 延迟设置 gridVisible 为 true，确保数据更新和 WXML 渲染完成后再触发淡入
                setTimeout(() => {
                    this.setData({ gridVisible: true });
                }, 50); // 短暂延迟，确保渲染完成
            }
        }, 300); // 匹配 CSS transition 的持续时间
    },

    // 图片预览功能 (使用微信小程序内置 API)
    previewImage(e) {
        const currentUrl = e.currentTarget.dataset.url; // 获取当前点击图片的 URL
        // 获取当前显示的所有图片的 URL 列表，用于在预览时左右滑动
        const urls = this.data.filteredPortfolioItems.map(item => item.url); 

        wx.previewImage({
            current: currentUrl, // 当前显示图片的 HTTP 链接
            urls: urls // 需要预览的图片 HTTP 链接列表
        });
    }

    // 移除自定义模态框相关方法
    // closeModal() {
    //     this.setData({ showModal: false, modalImageUrl: '' });
    // }
});