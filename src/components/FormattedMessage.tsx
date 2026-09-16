import React from 'react';
import Markdown from 'react-native-markdown-display';
import { StyleSheet } from 'react-native';

interface Props {
  text: string;
}

export const FormattedMessage: React.FC<Props> = ({ text }) => (
  <Markdown style={markdownStyles}>{text}</Markdown>
);

const markdownStyles = StyleSheet.create({
  body: {
    color: '#1a1a1a',
    fontSize: 16,
    lineHeight: 26,
  },
  strong: {
    fontWeight: '700',
  },
  em: {
    fontStyle: 'italic',
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  list_item: {
    marginVertical: 2,
  },
  code_inline: {
    backgroundColor: '#f1f5f9',
    color: '#091e42',
    borderRadius: 4,
    paddingHorizontal: 4,
    fontFamily: 'monospace',
  },
  code_block: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  fence: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  table: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    marginVertical: 8,
  },
  th: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: 6,
    fontWeight: '600',
  },
  td: {
    padding: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  blockquote: {
    backgroundColor: '#f8fafc',
    borderLeftWidth: 3,
    borderLeftColor: '#10a37f',
    paddingLeft: 12,
    paddingVertical: 4,
  },
});