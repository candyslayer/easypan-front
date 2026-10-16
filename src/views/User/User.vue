<template>
  <div class="aether-user-page">
    <!-- 顶部导航栏 (Matching _1/code.html) -->
    <header class="user-top-header">
      <div class="header-inner">
        <div class="header-left">
          <button class="back-btn" @click="router.back()" title="返回">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <div class="header-title-box">
            <span class="title-main">Storage Manager</span>
            <span class="title-sub">账户与存储中心</span>
          </div>
        </div>

        <div class="header-right">
          <button class="header-icon-btn" @click="router.push('/main/all')" title="主页">
            <span class="material-symbols-outlined">home</span>
          </button>
        </div>
      </div>
    </header>

    <div class="user-content-scroll">
      <!-- 1. 用户个人信息卡片 -->
      <section class="profile-card">
        <div class="avatar-col" @click="openAvatarDialog" title="点击修改头像">
          <Avatar
            :key="avatarKey"
            :user-id="userInfo.userId"
            :size="64"
          />
          <div class="avatar-edit-badge">
            <span class="material-symbols-outlined">photo_camera</span>
          </div>
        </div>

        <div class="info-col">
          <div class="name-row">
            <h2 class="user-name">{{ userInfo.nickName || '网盘用户' }}</h2>
            <span v-if="userInfo.isAdmin" class="role-badge admin-badge">管理员</span>
            <span v-else class="role-badge member-badge">个人旗舰版</span>
          </div>
          <div class="user-id-text">UID: {{ userInfo.userId || '--' }}</div>
        </div>
      </section>

      <!-- 2. 存储空间全景卡片 (Matching _1/code.html) -->
      <section class="storage-card">
        <div class="storage-card-header">
          <div class="header-title-wrap">
            <span class="material-symbols-outlined storage-icon">cloud</span>
            <span class="card-title">云端存储状态</span>
          </div>
          <span class="tier-pill">个人旗舰版</span>
        </div>

        <!-- 容量数据高亮 -->
        <div class="usage-stat-row">
          <div class="stat-left">
            <span class="used-val">{{ proxy.Utils.size2Str(spaceUse.useSpace) }}</span>
            <span class="total-val"> / {{ proxy.Utils.size2Str(spaceUse.totalSpace) }}</span>
          </div>
          <div class="stat-right">
            <span class="percent-text">{{ percentage }}% 已使用</span>
          </div>
        </div>

        <!-- 多色分段进度条 -->
        <div class="meter-bar-track">
          <div class="meter-segment seg-video" :style="{ width: storageSegments.video + '%' }" title="视频"></div>
          <div class="meter-segment seg-img" :style="{ width: storageSegments.img + '%' }" title="图片"></div>
          <div class="meter-segment seg-doc" :style="{ width: storageSegments.doc + '%' }" title="文档"></div>
          <div class="meter-segment seg-other" :style="{ width: storageSegments.other + '%' }" title="其他"></div>
        </div>

        <!-- 详细分类网格 -->
        <div class="breakdown-grid">
          <div class="grid-item">
            <span class="dot dot-video"></span>
            <div class="item-text">
              <span class="label">视频媒体</span>
              <span class="val">{{ proxy.Utils.size2Str(Math.round(spaceUse.useSpace * 0.42)) }}</span>
            </div>
          </div>
          <div class="grid-item">
            <span class="dot dot-img"></span>
            <div class="item-text">
              <span class="label">高清图片</span>
              <span class="val">{{ proxy.Utils.size2Str(Math.round(spaceUse.useSpace * 0.28)) }}</span>
            </div>
          </div>
          <div class="grid-item">
            <span class="dot dot-doc"></span>
            <div class="item-text">
              <span class="label">文档工作表</span>
              <span class="val">{{ proxy.Utils.size2Str(Math.round(spaceUse.useSpace * 0.18)) }}</span>
            </div>
          </div>
          <div class="grid-item">
            <span class="dot dot-other"></span>
            <div class="item-text">
              <span class="label">系统与其他</span>
              <span class="val">{{ proxy.Utils.size2Str(Math.max(0, Math.round(spaceUse.useSpace * 0.12))) }}</span>
            </div>
          </div>
        </div>

        <!-- 优化与清理推荐卡片 -->
        <div class="cleanup-recommendations">
          <div class="recommend-item" @click="router.push('/main/recycle')">
            <div class="rec-left">
              <div class="rec-icon-box bg-error-box">
                <span class="material-symbols-outlined text-error">delete_sweep</span>
              </div>
              <div class="rec-info">
                <span class="rec-title">清空回收站</span>
                <span class="rec-desc">定期清理可释放更多存储容量</span>
              </div>
            </div>
            <button class="rec-btn-action">前往清理</button>
          </div>
        </div>
      </section>

      <!-- 3. 升级扩容套餐横幅 (Promotion Banner) -->
      <section class="upgrade-banner">
        <div class="banner-content">
          <span class="promo-tag">限时特惠 7 折</span>
          <h3 class="banner-title">升级至 2TB 专业空间</h3>
          <p class="banner-sub">支持超大文件极速双向传输与原画无损画质播放</p>
        </div>
        <button class="upgrade-action-btn" @click="handleUpgradeTip">立即扩容</button>
      </section>

      <!-- 4. 账户安全与设置菜单 -->
      <section class="menu-list-card">
        <div class="menu-item" @click="openAvatarDialog">
          <div class="item-left">
            <div class="item-icon-box bg-blue">
              <span class="material-symbols-outlined">account_circle</span>
            </div>
            <span class="item-label">修改个人头像</span>
          </div>
          <span class="material-symbols-outlined item-arrow">chevron_right</span>
        </div>

        <div class="menu-item" @click="openPasswordDialog">
          <div class="item-left">
            <div class="item-icon-box bg-amber">
              <span class="material-symbols-outlined">lock</span>
            </div>
            <span class="item-label">修改登录密码</span>
          </div>
          <span class="material-symbols-outlined item-arrow">chevron_right</span>
        </div>

        <div class="menu-item logout-item" @click="handleLogout">
          <div class="item-left">
            <div class="item-icon-box bg-red">
              <span class="material-symbols-outlined text-danger">logout</span>
            </div>
            <span class="item-label text-danger">退出登录</span>
          </div>
          <span class="material-symbols-outlined item-arrow">chevron_right</span>
        </div>
      </section>
    </div>

    <!-- 修改头像弹窗 -->
    <Dialog
      :show="avatarDialog.show"
      title="修改头像"
      width="380px"
      :buttons="avatarDialog.buttons"
      @close="avatarDialog.show = false"
    >
      <div class="avatar-dialog-content">
        <div class="preview-box">
          <img v-if="avatarPreviewUrl" :src="avatarPreviewUrl" class="preview-img" />
          <Avatar v-else :user-id="userInfo.userId" :size="90"></Avatar>
        </div>
        <div class="upload-trigger">
          <input
            ref="avatarFileInput"
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            style="display: none"
            @change="handleAvatarFileChange"
          />
          <el-button type="primary" @click="$refs.avatarFileInput.click()">
            <span class="material-symbols-outlined" style="margin-right: 4px; font-size: 18px;">photo_camera</span>
            选择本地图片
          </el-button>
          <span class="upload-tip">支持 JPG、PNG 格式图片</span>
        </div>
      </div>
    </Dialog>

    <!-- 修改密码弹窗 -->
    <Dialog
      :show="passwordDialog.show"
      title="修改登录密码"
      width="380px"
      :buttons="passwordDialog.buttons"
      @close="passwordDialog.show = false"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="85px"
        size="default"
      >
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="passwordForm.password"
            type="password"
            show-password
            placeholder="请输入新密码(8-18位)"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="rePassword">
          <el-input
            v-model="passwordForm.rePassword"
            type="password"
            show-password
            placeholder="请再次确认新密码"
          />
        </el-form-item>
      </el-form>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, getCurrentInstance, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElForm, ElFormItem, ElInput } from 'element-plus'
import Avatar from '@/components/Avatar.vue'
import Dialog from '@/components/Dialog.vue'

const { proxy } = getCurrentInstance()
const router = useRouter()

const api = {
  getUserSpace: '/getUserSpace',
  uploadAvatar: '/uploadUserAvatar',
  updatePassword: '/updatePassword',
  logout: '/logout'
}

const userInfo = ref(proxy.vueCookies.get('userInfo') || {})
const avatarKey = ref(Date.now())

// 存储空间
const spaceUse = ref({
  totalSpace: 1,
  useSpace: 0
})

const percentage = computed(() => {
  if (!spaceUse.value.totalSpace) return 0
  const rate = Math.ceil((spaceUse.value.useSpace / spaceUse.value.totalSpace) * 100)
  return Math.min(rate, 100)
})

const storageSegments = computed(() => {
  const pct = percentage.value
  const video = Math.round(pct * 0.42)
  const img = Math.round(pct * 0.28)
  const doc = Math.round(pct * 0.18)
  const other = Math.max(0, pct - video - img - doc)
  return { video, img, doc, other }
})

const getUserSpace = async () => {
  let result = await proxy.request({
    url: api.getUserSpace
  })
  if (!result) return
  spaceUse.value = result.data
}

const handleUpgradeTip = () => {
  proxy.message.info('当前已为旗舰版账户，享受全部高级存储权益')
}

// 修改头像弹窗逻辑
const avatarDialog = reactive({
  show: false,
  buttons: [
    {
      text: '保存头像',
      type: 'primary',
      click: () => submitAvatar()
    }
  ]
})
const avatarFile = ref(null)
const avatarPreviewUrl = ref('')

const openAvatarDialog = () => {
  avatarFile.value = null
  avatarPreviewUrl.value = ''
  avatarDialog.show = true
}

const handleAvatarFileChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
    proxy.message.warning('请选择 JPG 或 PNG 格式图片！')
    return
  }
  avatarFile.value = file
  avatarPreviewUrl.value = URL.createObjectURL(file)
}

const submitAvatar = async () => {
  if (!avatarFile.value) {
    proxy.message.warning('请先选择头像图片！')
    return
  }
  let result = await proxy.request({
    url: api.uploadAvatar,
    params: {
      avatar: avatarFile.value
    }
  })
  if (!result) return
  proxy.message.success('头像修改成功！')
  avatarDialog.show = false
  avatarKey.value = Date.now()
}

// 修改密码弹窗逻辑
const passwordDialog = reactive({
  show: false,
  buttons: [
    {
      text: '确认修改',
      type: 'primary',
      click: () => submitPassword()
    }
  ]
})
const passwordFormRef = ref()
const passwordForm = reactive({
  password: '',
  rePassword: ''
})

const validateRePass = (rule, value, callback) => {
  if (value !== passwordForm.password) {
    callback(new Error('两次输入的密码不一致！'))
  } else {
    callback()
  }
}

const passwordRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 18, message: '密码长度需在 8-18 位之间', trigger: 'blur' }
  ],
  rePassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateRePass, trigger: 'blur' }
  ]
}

const openPasswordDialog = () => {
  passwordForm.password = ''
  passwordForm.rePassword = ''
  passwordDialog.show = true
}

const submitPassword = () => {
  passwordFormRef.value.validate(async (valid) => {
    if (!valid) return
    let result = await proxy.request({
      url: api.updatePassword,
      params: {
        password: passwordForm.password
      }
    })
    if (!result) return
    proxy.message.success('密码修改成功，请重新登录！')
    passwordDialog.show = false
    handleLogoutDirect()
  })
}

// 退出登录
const handleLogout = () => {
  proxy.confirm('确定要退出当前网盘账号吗？', async () => {
    handleLogoutDirect()
  })
}

const handleLogoutDirect = async () => {
  await proxy.request({
    url: api.logout
  })
  proxy.vueCookies.remove('userInfo')
  router.push('/login')
}

onMounted(() => {
  getUserSpace()
})
</script>

<style lang="scss" scoped>
.aether-user-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8f9ff;
  color: #0b1c30;
  box-sizing: border-box;

  // 顶部导航栏
  .user-top-header {
    position: sticky;
    top: 0;
    width: 100%;
    z-index: 50;
    background: rgba(248, 249, 255, 0.85);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid #e5eeff;

    .header-inner {
      height: 58px;
      padding: 0 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .header-left {
        display: flex;
        align-items: center;
        gap: 10px;

        .back-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: none;
          background: #eff4ff;
          color: #0b1c30;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s;

          span {
            font-size: 20px;
          }

          &:hover {
            background: #e5eeff;
          }
        }

        .header-title-box {
          display: flex;
          flex-direction: column;

          .title-main {
            font-size: 15px;
            font-weight: 700;
            color: #0b1c30;
            letter-spacing: -0.01em;
          }

          .title-sub {
            font-size: 11px;
            color: #737686;
          }
        }
      }

      .header-right {
        .header-icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: #434655;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;

          span {
            font-size: 20px;
          }

          &:hover {
            background: #eff4ff;
            color: #004ac6;
          }
        }
      }
    }
  }

  .user-content-scroll {
    padding: 14px 14px 90px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 580px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }

  // 1. 用户个人卡片
  .profile-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 1px 4px rgba(11, 28, 48, 0.04);
    border: 1px solid #e5eeff;
    display: flex;
    align-items: center;
    gap: 14px;

    .avatar-col {
      position: relative;
      cursor: pointer;
      flex-shrink: 0;

      .avatar-edit-badge {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #004ac6;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 1px 3px rgba(0, 74, 198, 0.4);

        span {
          font-size: 12px;
        }
      }
    }

    .info-col {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .name-row {
        display: flex;
        align-items: center;
        gap: 8px;

        .user-name {
          font-size: 16px;
          font-weight: 700;
          color: #0b1c30;
          margin: 0;
        }

        .role-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 9999px;

          &.admin-badge {
            background: #dbe1ff;
            color: #004ac6;
          }

          &.member-badge {
            background: #dae2fd;
            color: #5c647a;
          }
        }
      }

      .user-id-text {
        font-size: 12px;
        color: #737686;
        font-family: 'JetBrains Mono', monospace;
      }
    }
  }

  // 2. 存储空间卡片
  .storage-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 1px 4px rgba(11, 28, 48, 0.04);
    border: 1px solid #e5eeff;
    display: flex;
    flex-direction: column;
    gap: 12px;

    .storage-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .header-title-wrap {
        display: flex;
        align-items: center;
        gap: 6px;

        .storage-icon {
          color: #004ac6;
          font-size: 20px;
        }

        .card-title {
          font-size: 14px;
          font-weight: 700;
          color: #0b1c30;
        }
      }

      .tier-pill {
        font-size: 10px;
        font-weight: 600;
        background: #eff4ff;
        color: #004ac6;
        padding: 2px 8px;
        border-radius: 9999px;
      }
    }

    .usage-stat-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;

      .stat-left {
        .used-val {
          font-size: 22px;
          font-weight: 700;
          color: #0b1c30;
          letter-spacing: -0.02em;
        }

        .total-val {
          font-size: 13px;
          color: #737686;
        }
      }

      .stat-right {
        .percent-text {
          font-size: 12px;
          font-weight: 600;
          color: #004ac6;
        }
      }
    }

    .meter-bar-track {
      height: 8px;
      width: 100%;
      background: #eff4ff;
      border-radius: 9999px;
      overflow: hidden;
      display: flex;
      gap: 1px;

      .meter-segment {
        height: 100%;

        &.seg-video {
          background: #004ac6;
        }

        &.seg-img {
          background: #0284c7;
        }

        &.seg-doc {
          background: #f59e0b;
        }

        &.seg-other {
          background: #94a3b8;
        }
      }
    }

    .breakdown-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      padding-top: 4px;

      .grid-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;

          &.dot-video { background: #004ac6; }
          &.dot-img { background: #0284c7; }
          &.dot-doc { background: #f59e0b; }
          &.dot-other { background: #94a3b8; }
        }

        .item-text {
          display: flex;
          flex-direction: column;

          .label {
            font-size: 11px;
            color: #737686;
          }

          .val {
            font-size: 13px;
            font-weight: 600;
            color: #0b1c30;
          }
        }
      }
    }

    .cleanup-recommendations {
      padding-top: 6px;

      .recommend-item {
        background: #eff4ff;
        border-radius: 12px;
        padding: 10px 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        transition: background 0.15s;

        &:hover {
          background: #e5eeff;
        }

        .rec-left {
          display: flex;
          align-items: center;
          gap: 10px;

          .rec-icon-box {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;

            &.bg-error-box {
              background: #ffdad6;

              .text-error {
                color: #ba1a1a;
                font-size: 18px;
              }
            }
          }

          .rec-info {
            display: flex;
            flex-direction: column;

            .rec-title {
              font-size: 13px;
              font-weight: 600;
              color: #0b1c30;
            }

            .rec-desc {
              font-size: 11px;
              color: #737686;
            }
          }
        }

        .rec-btn-action {
          padding: 4px 10px;
          border-radius: 9999px;
          background: #ffdad6;
          color: #ba1a1a;
          border: none;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }
      }
    }
  }

  // 3. 升级套餐横幅
  .upgrade-banner {
    background: linear-gradient(135deg, #d3e4fe 0%, #eff4ff 100%);
    border-radius: 16px;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border: 1px solid #cbdbf5;

    .banner-content {
      flex: 1;

      .promo-tag {
        display: inline-block;
        background: #784b00;
        color: #ffeedd;
        font-size: 10px;
        font-weight: 600;
        padding: 2px 7px;
        border-radius: 9999px;
        margin-bottom: 6px;
      }

      .banner-title {
        font-size: 14px;
        font-weight: 700;
        color: #0b1c30;
        margin: 0;
      }

      .banner-sub {
        font-size: 11px;
        color: #434655;
        margin: 4px 0 0;
      }
    }

    .upgrade-action-btn {
      padding: 8px 14px;
      border-radius: 10px;
      background: #004ac6;
      color: #ffffff;
      border: none;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0, 74, 198, 0.25);
      transition: background 0.15s;

      &:hover {
        background: #2563eb;
      }
    }
  }

  // 4. 账户设置列表卡片
  .menu-list-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 4px 0;
    box-shadow: 0 1px 4px rgba(11, 28, 48, 0.04);
    border: 1px solid #e5eeff;

    .menu-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      cursor: pointer;
      border-bottom: 1px solid #f2f5f9;
      transition: background 0.15s;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: #eff4ff;
      }

      .item-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .item-icon-box {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;

          span {
            font-size: 20px;
          }

          &.bg-blue {
            background: #dbe1ff;
            color: #004ac6;
          }

          &.bg-amber {
            background: #ffddb8;
            color: #784b00;
          }

          &.bg-red {
            background: #ffdad6;
          }
        }

        .item-label {
          font-size: 13px;
          font-weight: 500;
          color: #0b1c30;

          &.text-danger {
            color: #ba1a1a;
            font-weight: 600;
          }
        }

        .text-danger {
          color: #ba1a1a;
        }
      }

      .item-arrow {
        color: #737686;
        font-size: 18px;
      }
    }
  }

  // 头像弹窗
  .avatar-dialog-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 0;

    .preview-box {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      overflow: hidden;
      margin-bottom: 16px;
      border: 2px solid #e5eeff;
      display: flex;
      align-items: center;
      justify-content: center;

      .preview-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .upload-trigger {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;

      .upload-tip {
        font-size: 12px;
        color: #737686;
      }
    }
  }
}
</style>