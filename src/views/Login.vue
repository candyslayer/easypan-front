<template>
    <div class="container-layout">
        <div class="header">
            <span>easypan</span>
        </div>
        <div class="container">
            <div class="login-register">
                <span class="login-register-title" v-if="opType == 0">Login</span>
                <span class="login-register-title" v-if="opType == 1 || opType == 2">Sign Up</span>

                <ElForm class="login-register" :model="formData" ref="formDataRef" :rules="rules" :label-width="0">
                    <ElFormItem class="input-item" prop="email">
                        <!-- 采用绝对定位脱离文档，不然把输入框撑下去，不好看 -->
                        <span class="input-tip" v-if="formData.email">邮箱</span>
                        <ElInput v-model="formData.email" clearable placeholder="邮箱" :maxlength="110">
                        </ElInput>

                        <div class="checkCode-btn" v-if="opType == 1 || opType == 2">
                            <ElButton color="#626aef" size="small" @click="sendEmailCode">获取验证码</ElButton>
                        </div>
                    </ElFormItem>

                    <ElFormItem class="input-item" prop="password" v-if="opType == 0">
                        <span class="input-tip" v-if="formData.password">密码</span>
                        <ElInput v-model="formData.password" clearable placeholder="密码" show-password>
                        </ElInput>
                    </ElFormItem>

                    <!-- 注册时才有的 -->
                    <div v-if="opType == 1 || opType == 2">

                        <ElFormItem class="input-item" prop="emailCode">
                            <span class="input-tip" v-if="formData.emailCode">邮箱验证码</span>
                            <ElInput v-model="formData.emailCode" clearable placeholder="邮箱验证码">
                            </ElInput>
                        </ElFormItem>

                        <ElFormItem v-if="opType == 1" class="input-item" prop="nickName">
                            <span class="input-tip" v-if="formData.nickName">昵称</span>
                            <ElInput v-model="formData.nickName" clearable placeholder="昵称">
                            </ElInput>
                        </ElFormItem>

                        <ElFormItem class="input-item" prop="registerPassword">
                            <span class="input-tip" v-if="formData.registerPassword">密码</span>
                            <ElInput v-model="formData.registerPassword" clearable placeholder="密码" show-password>
                            </ElInput>
                        </ElFormItem>

                        <ElFormItem class="input-item" prop="reRegisterPassword">
                            <span class="input-tip" v-if="formData.reRegisterPassword">请再次输入密码</span>
                            <ElInput v-model="formData.reRegisterPassword" clearable placeholder="请再次输入密码"
                                show-password>
                            </ElInput>
                        </ElFormItem>
                    </div>

                    <ElFormItem class="input-item" prop="checkCode">
                        <span class="input-tip" v-if="formData.checkCode">验证码</span>

                        <ElInput v-model="formData.checkCode" placeholder="验证码" :maxlength="5">
                        </ElInput>

                        <img class="checkCode" :src="checkCodeUrl" @click="changeCheckCode(0)">
                    </ElFormItem>

                    <ElFormItem>
                        <div class="submit-login">
                            <ElButton size="large" color="#626aef" class="login-button" type="primary" round
                                @click="dosubmit">{{
                                    buttonName }}
                            </ElButton>
                        </div>
                    </ElFormItem>

                    <ElFormItem>
                        <div class="forget-password">
                            <span v-if="opType == 0" @click="changeToStatus(2)">忘记密码</span>
                        </div>
                    </ElFormItem>

                    <ElFormItem v-if="opType == 0">
                        <div class="login-in-qq">
                            <span class="qq-button">🐧</span>
                        </div>
                    </ElFormItem>

                    <ElFormItem>
                        <div class="forget-password">

                            <span v-if="opType == 0" @click="changeToStatus(1)">没有账号？注册一个</span>
                            <span v-if="opType == 1 || opType == 2" @click="changeToStatus(0)">已有账号？去登录</span>
                        </div>
                    </ElFormItem>
                </ElForm>

            </div>

            <Dialog class="send-email-dialog" :show="dialogConfig4SendEmail.show" :title="dialogConfig4SendEmail.title"
                ref="dialog4SendEmailRef" @close="closeDialog" width="90%" :show-cancel="false">
                <ElForm :model="sendEmailFormData" ref="sendEmailFormDataRef" :rules="rules">
                    <ElFormItem label="发送到邮箱:">
                        {{ sendEmailFormData.email }}
                    </ElFormItem>
                    <ElFormItem class="input-item" prop="checkCode">
                        <img :src="checkCode4SendEmail" @click="changeCheckCode(1)">
                        <ElInput v-model="sendEmailFormData.checkCode" maxlength="5" style="width: 50%;"></ElInput>
                    </ElFormItem>

                    <ElFormItem>
                        <div class="send-email-code-btn">
                            <ElButton color="#626aef" @click="getEmailCode">获取邮箱验证码</ElButton>
                        </div>
                    </ElFormItem>
                </ElForm>
            </Dialog>
        </div>


    </div>
</template>

<script setup>
import { ElInput, ElForm, ElFormItem, ElButton } from 'element-plus';
import { getCurrentInstance, nextTick, reactive, ref } from 'vue';
import Dialog from '../components/Dialog.vue';
import { useRoute, useRouter } from 'vue-router';
import md5 from 'js-md5';

const { proxy } = getCurrentInstance()

const router = useRouter()
const route = useRoute()

const formData = ref({})
const formDataRef = ref()

const api = {
    checkCode: "/api/checkCode",
    sendEmailCode: "/sendEmailCode",
    register: "/register",
    login: "/login",
    resetPassword: "/ResetPwd"
}

//校验两次输入是否相同
const checkRegisterPassword = (rule, value, callback) => {
    if (value != formData.value.registerPassword) {
        callback(new Error(rule.message))
    } else {
        callback()
    }
}

const rules = {
    email: [
        { required: true, message: "请输入邮箱" },
        { max: 150, message: "邮箱不能超过150字符" },
        { validator: proxy.verify.email, message: "请输入正确的邮箱格式" }
    ],
    emailCode: [{ required: true, message: "邮箱验证码不能为空" }],
    password: [
        {
            required: true, message: "请输入密码"
        }
    ],
    registerPassword: [{
        required: true, message: "密码不能为空",
    }, {
        max: 18, message: "需为数字,小写,大写字母,特殊符号.长度为8-18位"
    }, {
        min: 8, message: "需为数字,小写,大写字母,特殊符号.长度为8-18位"
    }, {
        validator: proxy.verify.password, message: "需为数字,小写,大写字母,特殊符号.长度为8-18位"
    },
    ], reRegisterPassword: [{
        validator: checkRegisterPassword, message: "两次密码输入不一致"
    }], nickName: [
        { required: true, message: "昵称不能为空" }
    ], checkCode: [{ required: true, message: "请输入验证码" }]
}
const opType = ref(0)
const buttonName = ref("登录")

const changeToStatus = (type) => {


    formDataRef.value.resetFields()

    opType.value = type

    if (type == 0) {
        buttonName.value = "登录"
    } else if (type == 1) {
        buttonName.value = "注册"
    }

    changeCheckCode(0)
}

const checkCodeUrl = ref(api.checkCode)
const checkCode4SendEmail = ref(api.checkCode)

const changeCheckCode = (type) => {
    if (type == 0) {
        checkCodeUrl.value = api.checkCode + "?type=" + type + "&time=" + new Date().getTime();
    } else {
        checkCode4SendEmail.value = api.checkCode + "?type=" + type + "&time=" + new Date().getTime();
    }
}

const dialog4SendEmailRef = ref()
let dialogConfig4SendEmail = reactive({
    show: false,
    title: "邮箱验证码",
})

const sendEmailFormData = ref({})
const sendEmailFormDataRef = ref()

const sendEmailCode = () => {
    formDataRef.value.validateField("email", (valid) => {
        if (!valid) {
            return
        }

        dialogConfig4SendEmail.show = true

        nextTick(() => {
            changeCheckCode(1)
            sendEmailFormDataRef.value.resetFields()
            sendEmailFormData.value = {
                email: formData.value.email
            }
        })
    })

}

const closeDialog = () => {
    dialogConfig4SendEmail.show = false
}

const getEmailCode = () => {
    sendEmailFormDataRef.value.validate(async (valid) => {
        if (!valid) {
            return
        }

        let params = {}
        Object.assign(params, sendEmailFormData.value)
        params.type = opType.value == 0 ? 0 : 1

        let result = await proxy.request({
            url: api.sendEmailCode,
            params: params,
            errorCallback: () => {
                changeCheckCode(1)
            }
        })

        if (!result) {
            return
        }

        proxy.message.success("发送成功")

        dialogConfig4SendEmail.show = false
    })
}

const dosubmit = () => {
    formDataRef.value.validate(async (valid) => {
        if (!valid) {
            return
        }

        let params = {}
        Object.assign(params, formData.value);

        const url = ref()

        if (opType.value == 0) {
            url.value = api.login

            params.password = md5(formData.value.password)
        } else if (opType.value == 1) {
            url.value = api.register

            params.password = md5(formData.value.registerPassword)
        } else {
            url.value = api.resetPassword

            params.password = md5(formData.value.registerPassword)
        }

        console.log(url.value)

        let result = await proxy.request({
            url: url.value,
            params: params,
            errorCallback: () => {
                changeCheckCode(0)
            }
        })

        if (!result) {
            return
        }

        if (opType.value == 1) {
            proxy.message.success("注册成功")

            opType.value = 0

        } else if (opType.value == 0) {
            proxy.message.success("登录成功")

            //登录成功，存储cookies
            console.log(result.data)
            proxy.vueCookies.set("userInfo", result.data)

            router.push("/")
        } else if (opType.value == 2) {
            proxy.message.success("重置密码成功")
        }


        formDataRef.value.resetFields()

    })
}

</script>
<style lang="scss">
.header {
    color: #626aef;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 75px 0px;
    font-size: 50px;
    font-weight: bolder;
}

.container {
    .login-register {
        .login-register-title {
            font-size: 25px;
            font-weight: bold;
            color: rgb(88, 88, 88);
        }

        .login-register {
            .input-item {
                margin: 33px 0px;
                position: relative;

                .input-tip {
                    position: absolute;
                    bottom: 22px;

                    font-size: small;
                    color: rgb(164, 158, 158);
                }

                .checkCode-btn {
                    position: absolute;
                    right: 0px;
                    top: 25px;
                    margin-top: 3px;
                }

                .checkCode {
                    position: absolute;
                    right: 0px;
                }
            }


            margin-top: 35px;

            .el-input__wrapper {
                box-shadow: 0px -1px 0 0px var(--el-input-hover-border-color) inset;
                border-radius: 0;
                padding: 0px;

                &.is-focus {
                    box-shadow: 0px -1px 0 0px var(--el-input-focus-border-color) inset;

                }
            }

            .submit-login {
                display: flex;
                justify-content: center;
                width: 100%;

                .login-button {
                    width: 90%;
                    height: 100%;
                }
            }

            .forget-password {
                display: flex;
                justify-content: center;
                color: rgb(136, 136, 136);
                width: 100%;
                cursor: pointer;
            }

            .login-in-qq {
                display: flex;
                justify-content: center;
                width: 100%;

                .qq-button {
                    font-size: 20px;
                }
            }
        }

    }

    .send-email-dialog {
        .input-item {
            .el-form-item__content {
                flex-wrap: nowrap;
                justify-content: space-between;
            }

            .el-input__wrapper {
                box-shadow: 0px -1px 0 0px var(--el-input-hover-border-color) inset;
                border-radius: 0;
                padding: 0px;

                &.is-focus {
                    box-shadow: 0px -1px 0 0px var(--el-input-focus-border-color) inset;
                }
            }
        }

        .send-email-code-btn {
            width: 100%;
            display: flex;
            justify-content: end;
        }
    }
}
</style>