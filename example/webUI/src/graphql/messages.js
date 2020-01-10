import gql from 'graphql-tag';

export default gql`
{
  messages(orderDirection: desc, orderBy: id) {
    sender {
      id
    }
    content
    timestamp
  }
}
`
