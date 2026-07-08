'-----------------------------------------------------------------------
' <copyright file="ConnectViewModel.cs" company="Technology Solutions UK Ltd"> 
'     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
' </copyright> 
' <author>Robin Stone</author>
'-----------------------------------------------------------------------
Imports System.Collections.Generic
Imports System.Linq
Imports System.Text

''' <summary>
''' View model used to connect to a UHF Reader
''' </summary>
Public Class ConnectViewModel
    Inherits PropertyChangedViewModel
    ''' <summary>
    ''' Backing field for port names
    ''' </summary>
    Private m_portNames As IEnumerable(Of String)

    ''' <summary>
    ''' Backing field for connection status
    ''' </summary>
    Private m_connectionStatus As String

    ''' <summary>
    ''' Initializes a new instance of the ConnectViewModel class
    ''' </summary>
    Public Sub New()
        Me.RefreshPorts()
    End Sub

    ''' <summary>
    ''' Gets a value indicating whether the reader is connected
    ''' </summary>
    Public ReadOnly Property IsConnected() As Boolean
        Get
            Return Service.Reader.IsConnected
        End Get
    End Property

    ''' <summary>
    ''' Gets a value indicating the connection status of the device
    ''' </summary>
    Public Property ConnectionStatus() As String
        Get
            Return Me.m_connectionStatus
        End Get

        Private Set(ByVal value As String)
            If Me.m_connectionStatus <> Value Then
                Me.m_connectionStatus = Value
                Me.OnPropertyChanged("ConnectionStatus")
            End If
        End Set
    End Property

    ''' <summary>
    ''' Gets or sets the selected port name
    ''' </summary>
    Public Property PortName() As String
        Get
            Return Service.Reader.PortName
        End Get

        Set(ByVal value As String)
            If Service.Reader.PortName <> Value Then
                Service.Reader.PortName = Value
            End If

            Me.OnPropertyChanged("PortName")
        End Set
    End Property

    ''' <summary>
    ''' Gets or sets the port names available for selection
    ''' </summary>
    Public Property PortNames() As IEnumerable(Of String)
        Get
            Return Me.m_portNames
        End Get

        Set(ByVal value As IEnumerable(Of String))
            If Me.m_portNames IsNot Value Then
                Me.m_portNames = Value
                Me.OnPropertyChanged("PortNames")
            End If
        End Set
    End Property

    ''' <summary>
    ''' Returns true if connect can be called
    ''' </summary>
    ''' <returns>True if the method an be called</returns>
    Public Function CanConnect() As Boolean
        Return Not Me.IsConnected
    End Function

    ''' <summary>
    ''' Returns true if disconnect can be called
    ''' </summary>
    ''' <returns>True if the method an be called</returns>
    Public Function CanDisconnect() As Boolean
        Return Me.IsConnected
    End Function

    ''' <summary>
    ''' Returns true if refresh ports can be called
    ''' </summary>
    ''' <returns>True if the method an be called</returns>
    Public Function CanRefreshPorts() As Boolean
        Return True
    End Function

    ''' <summary>
    ''' Connects to the reader
    ''' </summary>
    Public Sub Connect()
        Service.Reader.Connect()
        Dim messageFormat As String = If(Service.Reader.IsConnected, "Connected on {0}", "Unable to Connect to {0}")
        Me.ConnectionStatus = String.Format(System.Globalization.CultureInfo.CurrentUICulture, messageFormat, Me.PortName)
        Me.OnPropertyChanged("IsConnected")
    End Sub

    ''' <summary>
    ''' Disconnects from the reader
    ''' </summary>
    Public Sub Disconnect()
        Service.Reader.Disconnect()
        Me.ConnectionStatus = "Disconnected"
        Me.OnPropertyChanged("IsConnected")
    End Sub

    ''' <summary>
    ''' Refreshes the list of available ports that a reader may be connected to
    ''' </summary>
    Public Sub RefreshPorts()
        Me.PortNames = System.IO.Ports.SerialPort.GetPortNames()
    End Sub
End Class
