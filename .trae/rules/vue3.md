1. Vue3 规则（基于Composition API和TypeScript）
使用TypeScript：所有Vue3项目必须使用TypeScript，并定义明确的类型。

Composition API：新项目必须使用Composition API，避免使用Options API。

组件命名：组件名必须使用PascalCase，多个单词组成（例如：MyComponent.vue）。

Props定义：使用TypeScript的defineProps来定义props，并指定类型。

Emits定义：使用defineEmits来定义emit事件，并指定事件类型。

Ref和Reactive：使用ref和reactive来声明响应式数据，注意ref用于基本类型，reactive用于对象。

计算属性：使用computed来定义计算属性，确保返回一个响应式引用。

生命周期钩子：使用onMounted、onUpdated等组合式API的生命周期钩子，并注意清理副作用。

模板规范：模板中必须使用kebab-case来调用子组件，且标签必须闭合。

代码组织：在<script setup>中，按照以下顺序组织代码：Props、Emits、响应式数据、计算属性、生命周期钩子、方法。
每次修改过后 运行项目 如果有错误就修改！