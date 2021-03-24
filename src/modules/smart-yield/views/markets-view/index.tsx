import React from 'react';
import cn from 'classnames';
import { formatUSDValue } from 'web3/utils';

import Icon, { IconNames } from 'components/custom/icon';
import { Hint, Text } from 'components/custom/typography';
import { mergeState } from 'hooks/useMergeState';
import { Markets, SYMarketMeta } from 'modules/smart-yield/api';
import { usePools } from 'modules/smart-yield/providers/pools-provider';
import PoolsTable from 'modules/smart-yield/views/markets-view/pools-table';

type State = {
  activeMarket?: SYMarketMeta;
};

const InitialState: State = {
  activeMarket: Array.from(Markets.values())[0],
};

const MarketsView: React.FC = () => {
  const poolsCtx = usePools();
  const { totalLiquidity } = poolsCtx;

  const [state, setState] = React.useState<State>(InitialState);

  return (
    <>
      <div className="tab-cards mb-64">
        {Array.from(Markets.values()).map(market => (
          <button
            key={market.name}
            type="button"
            className={cn('tab-card', state.activeMarket === market && 'active')}
            disabled={!market.active}
            style={{ color: !market.active ? 'red' : '' }}
            onClick={() => {
              setState(
                mergeState<State>({
                  activeMarket: market,
                }),
              );
            }}>
            <Icon name={market.icon as IconNames} width={40} height={40} className="mr-16" color="inherit" />
            <div>
              <Text type="p1" weight="semibold" color="primary">
                {market.name}
              </Text>
              <Text type="small" weight="semibold" color="secondary">
                {market.active ? 'Markets' : 'Coming soon'}
              </Text>
            </div>
          </button>
        ))}
      </div>
      {state.activeMarket && (
        <>
          <Hint text="This number shows the total liquidity provided to the market by the junior and senior tranche holders.">
            <Text type="p1" weight="semibold" color="secondary" className="mb-8">
              {state.activeMarket.name} total liquidity
            </Text>
          </Hint>
          <Text type="h2" weight="bold" color="primary" className="mb-40">
            {formatUSDValue(totalLiquidity)}
          </Text>
        </>
      )}
      <div className="card">
        <PoolsTable activeMarket={state.activeMarket} />
      </div>
    </>
  );
};

export default MarketsView;
