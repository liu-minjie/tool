## install

```
npm install -g yo
npm install generator-enhancer -g
```
or

```
npm install -g cnpm --registry=https://registry.npm.taobao.org
npm install -g yo
cnpm install generator-enhancer -g
```




## create project

```
mkdir testProject
cd testProject
yo enhancer
```

## add page

```
yo enhancer:page
```

## add component

```
yo enhancer:component
```

## i18n
- global i18n file is at `src/i18n`, which will be merge into every page's i18n 
- every page has it's i18n file which is at `src/pages/pageName/i18n/`
- every component has it's i18n file which is at`src/components/componentName/i18n/`