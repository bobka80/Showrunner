//-----------------------------------------------------------------------
// <copyright file="QueryParameters.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Entities
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    using TechnologySolutions.Rfid.AsciiProtocol;
    using TechnologySolutions.Rfid.AsciiProtocol.Parameters;

    /// <summary>
    /// Defines an observable version of <see cref="IQueryParameters"/>
    /// </summary>
    public interface IObservableQueryParameters
        : IQueryParameters, System.ComponentModel.INotifyPropertyChanged
    {
    }

    /// <summary>
    /// Container for the query parameters
    /// </summary>
    public class QueryParameters
        : PropertyChangedEntityBase, IObservableQueryParameters
    {
        /// <summary>
        /// Backing field for QuerySelect
        /// </summary>
        private QuerySelect? querySelect;

        /// <summary>
        /// Backing field for QuerySession
        /// </summary>
        private QuerySession? querySession;

        /// <summary>
        /// Backing field for QueryTarget
        /// </summary>
        private QueryTarget? queryTarget;

        /// <summary>
        /// Gets or sets whether to query transponders by the selected flag (all means use QuerySession)
        /// </summary>
        public QuerySelect? QuerySelect
        {
            get
            {
                return this.querySelect;
            }

            set
            {
                if (this.querySelect != value)
                {
                    this.querySelect = value;
                    this.OnPropertyChanged("QuerySelect");
                }
            }
        }

        /// <summary>
        /// Gets or sets the session to query
        /// </summary>
        public QuerySession? QuerySession
        {
            get
            {
                return this.querySession;
            }

            set
            {
                if (this.querySession != value)
                {
                    this.querySession = value;
                    this.OnPropertyChanged("QuerySession");
                }
            }
        }

        /// <summary>
        /// Gets or sets whether the flag target to reruen
        /// </summary>
        public QueryTarget? QueryTarget
        {
            get
            {
                return this.queryTarget;
            }

            set
            {
                if (this.queryTarget != value)
                {
                    this.queryTarget = value;
                    this.OnPropertyChanged("QueryTarget");
                }
            }
        }
    }
}
