## install

```
npm install -g yo
npm install generator-xxxx -g
```
or

```
npm install -g cnpm --registry=https://registry.npm.taobao.org
npm install -g yo
cnpm install generator-xxxx -g
```




## create project

```
mkdir testProject
cd testProject
yo xxxx
```

## add page

```
yo xxxx:page
```

## add component

```
yo xxxx:component
```

## i18n
- global i18n file is at `src/i18n`, which will be merge into every page's i18n 
- every page has it's i18n file which is at `src/pages/pageName/i18n/`
- every component has it's i18n file which is at`src/components/componentName/i18n/`