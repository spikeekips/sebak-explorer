import React, { Component, Fragment } from 'react';
import { Link } from 'react-router-dom';
import sebakService from '../sebak/service';
import Card from '../components/Card';
import LoadingIndicator from '../components/LoadingIndicator';
import ActionButton from '../components/ActionButton';
import MediaQuery from 'react-responsive';
import { dateFormatter, stringFormatter, numberFormatter } from '../util/formatters';

class Blocks extends Component {
  constructor(props) {
    super(props);
    this.state = {
      blocks: {
        data: []
      },
      currentPage: 0
    }
  }
  async componentDidMount() {
    const blocks = await sebakService.getBlocks({
      reverse: true,
      limit: 10
    });

    this.setState({
      blocks
    });
  }
  previousPage = () => {
    const { blocks, currentPage } = this.state;
    this.paginate(blocks.next(), currentPage - 1);
  }
  nextPage = () => {
    const { blocks, currentPage } = this.state;
    this.paginate(blocks.previous(), currentPage + 1);
  }
  paginate = (linkPromise, page) => {
    const { currentPage } = this.state;

    this.setState({
      blocks: {
        data: []
      }
    });

    linkPromise.then(blocks => {
      this.setState({
        blocks: page < currentPage  ? this._reverseOrder(blocks) : blocks,
        currentPage: page
      });
    });
  }
  _reverseOrder = (blocks) => {
    blocks.data = blocks.data.reverse()
    return blocks
  }
  render() {
    return (
      <Card title="Blocks">
        {
          this.state.blocks.data.length === 0 &&
          <LoadingIndicator/>
        }
        {
          this.state.blocks.data.length > 0 &&
          <Fragment>
              <table className="table">
              <tbody>
                <MediaQuery maxWidth={768}>
                    {this.state.blocks.data.map((block) => (
                      <tr className="table__content" key={block.hash}>
                        <td className="table__item">
                          Height <Link to={`/blocks/${block.height}`} className="link">
                            {numberFormatter.format(block.height)}
                          </Link> confirmed by <Link to={`/blocks/${block.hash}`} className="link">
                            {stringFormatter.truncate(block.hash, 10, '...')}
                          </Link> on {dateFormatter.formatAsDatetime(block.date)}
                        </td>
                      </tr>
                    ))}
                  </MediaQuery>
                  <MediaQuery minWidth={769}>
                      <tr className="table__header">
                        <th className="table__item">Hash</th>
                        <th className="table__item">Height</th>
                        <th className="table__item">Date</th>
                      </tr>
                      {this.state.blocks.data.map((block) => (
                        <tr className="table__content" key={block.hash}>
                          <td className="table__item">
                            <Link to={`/blocks/${block.hash}`} className="link">
                              {stringFormatter.truncate(block.hash, 10, '...')}
                            </Link>
                          </td>
                          <td className="table__item">
                            <Link to={`/blocks/${block.height}`} className="link">
                              {numberFormatter.format(block.height)}
                            </Link>
                          </td>
                          <td className="table__item">{dateFormatter.formatAsDatetime(block.date)}</td>
                        </tr>
                      ))}
                  </MediaQuery>
                </tbody>
              </table>
              <div className="paginator">
                { this.state.currentPage > 0 && <ActionButton onClick={this.previousPage}>Previous page</ActionButton> }
                <ActionButton onClick={this.nextPage} style={this.state.currentPage === 0 ? {marginLeft: 'auto'} : {} }>Next page</ActionButton>
              </div>
          </Fragment>
        }
      </Card>
    );
  }
}

export default Blocks;
