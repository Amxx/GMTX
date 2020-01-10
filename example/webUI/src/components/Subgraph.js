import React from 'react';
import { useQuery } from '@apollo/react-hooks';
import { Badge, Card, ProgressBar } from 'react-bootstrap';

import graphql from '../graphql';

function extract(data)
{
	if      (data.failed) return { class: 'danger',  descr: 'failed',  chain: data.chains[0], error: data.error }
	else if (data.synced) return { class: 'success', descr: 'synched', chain: data.chains[0], error: data.error }
	else                  return { class: 'info',    descr: 'pending', chain: data.chains[0], error: data.error }
}

const Subgraph = (props) => {
	const { data, loading, error } = useQuery(
		graphql.subgraph,
		{
			variables:
			{
				name: props.name
			},
			pollInterval: 10000
		}
	)

	if (loading) { return null;              }
	if (error  ) { return `Error! ${error}`; }

	return (
		<>
			{
				data.result
				.map(extract)
				.map((details, i) =>
					<Card key={i} bg="light" border={details.class} text={details.class} className="shadow mb-3">
						<Card.Header className="font-weight-bold text-capitalize p-3">
							<h3>
								{ details.chain.network }
							</h3>
							<Badge pill variant={details.class} className="float-right">
								{details.descr}
							</Badge>
						</Card.Header>
						<Card.Body>
							<ProgressBar
								animated
								variant={details.class}
								now={details.chain.latestBlock.number}
								max={details.chain.chainHeadBlock.number}
								label={`${details.chain.latestBlock.number} / ${details.chain.chainHeadBlock.number}`}
							/>
							<Card.Text>
								<code>
									{ details.error }
								</code>
							</Card.Text>
						</Card.Body>
					</Card>
				)
			}
		</>
	);
}

export default Subgraph;
