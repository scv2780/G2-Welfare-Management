<template>
  <ckeditor 
    v-model="data" 
    :editor="ClassicEditor" 
    :config="config" 
    :disabled="props.readOnly" />
</template>
<script setup>
import { ref, computed, defineProps } from "vue";

const props = defineProps({
  readOnly: { type: Boolean, default: false },
});
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Heading,
  Highlight,
  ImageBlock,
  ImageCaption,
  ImageInline,
  ImageInsert,
  ImageInsertViaUrl,
  ImageResize,
  ImageStyle,
  ImageTextAlternative,
  ImageToolbar,
  ImageUpload,
  Link,
  LinkImage,
  List,
  ListProperties,
  PasteFromOffice,
  SelectAll,
  Strikethrough,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  TodoList,
  Underline,
  Undo,
} from "ckeditor5";
import { Ckeditor } from "@ckeditor/ckeditor5-vue";

import "ckeditor5/ckeditor5.css";

const data = ref("<p>Hello world!</p>");

const config = computed(() => {
  return {
    licenseKey: "GPL", // Or 'GPL'.
    // 임포트된 모든 플러그인들을 추가합니다.
    plugins: [
      Essentials,
      Paragraph,
      Bold,
      Italic,
      Heading,
      Highlight,
      ImageBlock,
      ImageCaption,
      ImageInline,
      ImageInsert,
      ImageInsertViaUrl,
      ImageResize,
      ImageStyle,
      ImageTextAlternative,
      ImageToolbar,
      ImageUpload,
      Link,
      LinkImage,
      List,
      ListProperties,
      PasteFromOffice,
      SelectAll,
      Strikethrough,
      Table,
      TableCaption,
      TableCellProperties,
      TableColumnResize,
      TableProperties,
      TableToolbar,
      TodoList,
      Underline,
      Undo,
    ],
    // 툴바에 관련된 기능들을 추가합니다.
    toolbar: [
      "undo",
      "redo",
      "|",
      "heading", // Heading 플러그인 추가
      "bold",
      "italic",
      "underline",
      "strikethrough",
      "highlight",
      "|",
      "link",
      "insertImage", // ImageInsert 플러그인
      "insertImageViaUrl", // ImageInsertViaUrl 플러그인
      "imageUpload", // ImageUpload 플러그인
      "|",
      "insertTable", // Table 플러그인
      "|",
      "bulletedList",
      "numberedList",
      "todoList",
      "|",
      "selectAll", // SelectAll 플러그인
    ],
    // 이미지 플러그인 관련 추가 설정 (Toolbar에 ImageToolbar를 추가했으므로 필요)
    image: {
      toolbar: [
        "imageTextAlternative",
        "|",
        "imageStyle:inline",
        "imageStyle:block",
        "imageStyle:side",
        "|",
        "linkImage",
      ],
    },
    // 테이블 플러그인 관련 추가 설정 (Toolbar에 TableToolbar를 추가했으므로 필요)
    table: {
      contentToolbar: [
        "tableColumnResize",
        "tableProperties",
        "tableCellProperties",
        "toggleTableCaption",
      ],
    },
    // 리스트 플러그인 관련 추가 설정 (ListProperties를 사용했으므로 필요)
    list: {
      properties: {
        styles: true,
        startIndex: true,
        reversed: true,
      },
    },
  };
});
</script>
