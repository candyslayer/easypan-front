<template>
  <div class="user-page">
    <!-- 用户头像与昵称展示卡片 -->
    <div class="profile-card">
      <div class="avatar-wrapper">
        <Avatar
          :key="avatarKey"
          :user-id="userInfo.userId"
          :size="72"
        ></Avatar>
      </div>
      <div class="profile-info">
        <div class="profile-name">{{ userInfo.nickName || '网盘用户' }}</div>
        <div class="profile-tag">
          <span v-if="userInfo.isAdmin" class="admin-badge">管理员</span>
          <span v-else class="user-badge">普通用户</span>
        </div>
      </div>
    </div>

    <!-- 功能菜单列表 -->
    <div class="menu-card">
      <div class="menu-item" @click="openAvatarDialog">
        <div class="item-left">
          <div class="item-icon-box icon-avatar">
            <span class="dripicons-user"></span>
          </div>
          <span class="item-text">修改头像</span>
        </div>
        <span class="dripicons-chevron-right item-arrow"></span>
      </div>

      <div class="menu-item" @click="openPasswordDialog">
        <div class="item-left">
          <div class="item-icon-box icon-pwd">
            <span class="dripicons-lock"></span>
          </div>
          <span class="item-text">修改密码</span>
        </div>
        <span class="dripicons-chevron-right item-arrow"></span>
      </div>

      <div class="menu-item" @click="handleLogout">
        <div class="item-left">
          <div class="item-icon-box icon-logout">
            <span class="dripicons-exit"></span>
          </div>
          <span class="item-text item-text-danger">退出登录</span>
        </div>
        <span class="dripicons-chevron-right item-arrow"></span>
      </div>
    </div>

    <!-- 存储空间卡片 -->
    <div class="storage-card">
      <div class="storage-header">
        <span class="dripicons-cloud storage-icon"></span>
        <span class="storage-title">云存储空间</span>
      </div>
      <div class="storage-body">
        <ElProgress
          type="dashboard"
          :percentage="percentage"
          :color="progressColor"
          :width="130"
        >
          <template #default="{ percentage }">
            <div class="dashboard-content">
              <span class="percent-num">{{ percentage }}%</span>
              <span class="percent-label">已使用</span>
            </div>
          </template>
        </ElProgress>
        <div class="storage-detail">
          <div class="detail-row">
            <span class="detail-dot used-dot"></span>
            <span class="detail-label">已用容量：</span>
            <span class="detail-val">{{ proxy.Utils.size2Str(spaceUse.useSpace) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-dot total-dot"></span>
            <span class="detail-label">总计容量：</span>
            <span class="detail-val">{{ proxy.Utils.size2Str(spaceUse.totalSpace) }}</span>
          </div>
        </div>
      </div>
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
          <el-button type="primary" size="small" @click="$refs.avatarFileInput.click()">
            <span class="dripicons-camera" style="margin-right: 4px;"></span>
            选择本地图片
          </el-button>
          <span class="upload-tip">支持 JPG、PNG 格式</span>
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
import { ElProgress, ElButton, ElForm, ElFormItem, ElInput } from 'element-plus'
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
  totalSpace: 0,
  useSpace: 0
})

const percentage = computed(() => {
  if (!spaceUse.value.totalSpace) return 0
  const rate = Math.ceil((spaceUse.value.useSpace / spaceUse.value.totalSpace) * 100)
  return Math.min(rate, 100)
})

const progressColor = computed(() => {
  if (percentage.value < 60) return '#67c23a'
  if (percentage.value < 85) return '#e6a23c'
  return '#f56c6c'
})

const getUserSpace = async () => {
  let result = await proxy.request({
    url: api.getUserSpace
  })
  if (!result) return
  spaceUse.value = result.data
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
.user-page {
  max-width: 480px;
  margin: 0 auto;
  padding: 16px 12px 30px;
  box-sizing: border-box;
  animation: fadeInSlideUp 0.35s cubic-bezier(0.25, 1, 0.5, 1) forwards;

  .profile-card {
    display: flex;
    align-items: center;
    background: #fff;
    border-radius: 12px;
    padding: 18px 20px;
    margin-bottom: 14px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
    }

    .avatar-wrapper {
      margin-right: 16px;
      flex-shrink: 0;
      transition: transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
      cursor: pointer;

      &:hover {
        transform: scale(1.08) rotate(4deg);
      }
    }

    .profile-info {
      display: flex;
      flex-direction: column;

      .profile-name {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 6px;
      }

      .profile-tag {
        .admin-badge {
          display: inline-block;
          font-size: 11px;
          background: #e8f4ff;
          color: #409eff;
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: 500;
          box-shadow: 0 0 6px rgba(64, 158, 255, 0.2);
        }

        .user-badge {
          display: inline-block;
          font-size: 11px;
          background: #f0f2f5;
          color: #909399;
          padding: 2px 8px;
          border-radius: 10px;
        }
      }
    }
  }

  .menu-card {
    background: #fff;
    border-radius: 12px;
    padding: 4px 0;
    margin-bottom: 14px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
    }

    .menu-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      cursor: pointer;
      border-bottom: 1px solid #f2f3f5;
      transition: background-color 0.2s ease, transform 0.15s ease;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background-color: #f9fbfd;

        .item-icon-box {
          transform: scale(1.12);
        }

        .item-arrow {
          transform: translateX(4px);
          color: #409eff;
        }
      }

      &:active {
        background-color: #edf2f7;
        transform: scale(0.99);
      }

      .item-left {
        display: flex;
        align-items: center;

        .item-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          font-size: 16px;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

          &.icon-avatar {
            background: #e6f7ff;
            color: #1890ff;
          }

          &.icon-pwd {
            background: #fff7e6;
            color: #fa8c16;
          }

          &.icon-logout {
            background: #fff1f0;
            color: #f5222d;
          }
        }

        .item-text {
          font-size: 15px;
          color: #303133;

          &.item-text-danger {
            color: #f5222d;
          }
        }
      }

      .item-arrow {
        color: #c0c4cc;
        font-size: 13px;
        transition: transform 0.25s ease, color 0.25s ease;
      }
    }
  }

  .storage-card {
    background: #fff;
    border-radius: 12px;
    padding: 18px 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
    }

    .storage-header {
      display: flex;
      align-items: center;
      margin-bottom: 16px;

      .storage-icon {
        font-size: 18px;
        color: #409eff;
        margin-right: 8px;
        animation: floatGentle 3s ease-in-out infinite;
      }

      .storage-title {
        font-size: 15px;
        font-weight: 600;
        color: #303133;
      }
    }

    .storage-body {
      display: flex;
      align-items: center;
      justify-content: space-around;
      gap: 15px;

      .dashboard-content {
        display: flex;
        flex-direction: column;
        align-items: center;

        .percent-num {
          font-size: 18px;
          font-weight: 700;
          color: #303133;
        }

        .percent-label {
          font-size: 11px;
          color: #909399;
          margin-top: 2px;
        }
      }

      .storage-detail {
        display: flex;
        flex-direction: column;
        gap: 10px;

        .detail-row {
          display: flex;
          align-items: center;
          font-size: 13px;

          .detail-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 8px;

            &.used-dot {
              background: #409eff;
            }

            &.total-dot {
              background: #dcdfe6;
            }
          }

          .detail-label {
            color: #606266;
          }

          .detail-val {
            font-weight: 600;
            color: #303133;
          }
        }
      }
    }
  }

  .avatar-dialog-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 15px 0;

    .preview-box {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      overflow: hidden;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

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
      gap: 6px;

      .upload-tip {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}
</style>